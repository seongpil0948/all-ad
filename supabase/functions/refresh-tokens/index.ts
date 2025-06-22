import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Redis } from "https://deno.land/x/redis@v0.31.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// OAuth configuration for different platforms
const OAUTH_CONFIGS = {
  google: {
    tokenEndpoint: "https://oauth2.googleapis.com/token",
  },
  facebook: {
    tokenEndpoint: "https://graph.facebook.com/v12.0/oauth/access_token",
  },
  kakao: {
    tokenEndpoint: "https://kauth.kakao.com/oauth/token",
  },
};

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Initialize Redis client
    const redisUrl = Deno.env.get("REDIS_URL");
    let redis: Redis | null = null;
    if (redisUrl) {
      try {
        const urlParts = new URL(redisUrl);
        redis = new Redis({
          hostname: urlParts.hostname,
          port: parseInt(urlParts.port || "6379"),
          password: urlParts.password,
          tls: redisUrl.startsWith("rediss://"),
        });
        await redis.connect();
      } catch (error) {
        console.error("Redis connection failed:", error);
      }
    }

    // Get all active platform credentials that use OAuth
    const { data: credentials, error } = await supabase
      .from("platform_credentials")
      .select("*")
      .in("platform", ["google", "facebook", "kakao"])
      .eq("is_active", true);

    if (error) {
      throw error;
    }

    const refreshResults = [];

    for (const credential of credentials || []) {
      try {
        const tokenKey = `oauth:${credential.platform}:${credential.user_id || credential.created_by}:${credential.account_id}:tokens`;

        // Try to get token data from Redis first
        let tokens = null;
        if (redis) {
          const tokenData = await redis.get(tokenKey);
          if (tokenData) {
            tokens = JSON.parse(tokenData);
          }
        }

        // Fall back to database if Redis doesn't have the data
        if (!tokens && credential.data?.oauth_tokens) {
          tokens = credential.data.oauth_tokens;
        }

        if (!tokens) {
          console.warn(
            `No token data found for ${credential.platform}:${credential.user_id || credential.created_by}`,
          );
          continue;
        }

        const now = Date.now();
        const refreshBuffer = 30 * 60 * 1000; // 30 minutes before expiry

        // Check if token needs refresh
        if (tokens.expires_at && tokens.expires_at - now < refreshBuffer) {
          const oauthConfig =
            OAUTH_CONFIGS[credential.platform as keyof typeof OAUTH_CONFIGS];

          if (!oauthConfig || !tokens.refresh_token) {
            console.warn(
              `Cannot refresh token for ${credential.platform}: missing config or refresh token`,
            );
            continue;
          }

          // Get team credentials for OAuth
          const { data: teamCreds } = await supabase
            .from("team_credentials")
            .select("*")
            .eq("team_id", credential.team_id)
            .eq("platform", credential.platform)
            .single();

          if (!teamCreds) {
            console.warn(
              `No team credentials found for ${credential.platform} in team ${credential.team_id}`,
            );
            continue;
          }

          // Refresh the token
          const refreshParams = new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: tokens.refresh_token,
            client_id: teamCreds.credentials.client_id,
            client_secret: teamCreds.credentials.client_secret,
          });

          const response = await fetch(oauthConfig.tokenEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: refreshParams.toString(),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Token refresh failed: ${errorText}`);
          }

          const newTokenData = await response.json();

          // Calculate new expiry time
          const expiresAt = now + (newTokenData.expires_in || 3600) * 1000;

          const updatedTokens = {
            access_token: newTokenData.access_token,
            refresh_token: newTokenData.refresh_token || tokens.refresh_token,
            expires_at: expiresAt,
            token_type: newTokenData.token_type || "Bearer",
          };

          // Store updated tokens in Redis
          if (redis) {
            await redis.set(tokenKey, JSON.stringify(updatedTokens));
            await redis.expire(tokenKey, 86400); // 24 hours TTL
          }

          // Update tokens in database
          await supabase
            .from("platform_credentials")
            .update({
              data: {
                ...credential.data,
                oauth_tokens: updatedTokens,
              },
              updated_at: new Date().toISOString(),
            })
            .eq("id", credential.id);

          refreshResults.push({
            platform: credential.platform,
            accountId: credential.account_id,
            status: "refreshed",
          });

          console.log(
            `Successfully refreshed token for ${credential.platform}:${credential.account_id}`,
          );
        } else {
          refreshResults.push({
            platform: credential.platform,
            accountId: credential.account_id,
            status: "not_needed",
          });
        }
      } catch (error) {
        console.error(
          `Failed to refresh token for ${credential.platform}:${credential.account_id}:`,
          error,
        );

        // Mark credential as inactive if refresh fails
        await supabase
          .from("platform_credentials")
          .update({
            is_active: false,
            data: {
              ...credential.data,
              refresh_error:
                error instanceof Error ? error.message : "Unknown error",
              refresh_failed_at: new Date().toISOString(),
            },
          })
          .eq("id", credential.id);

        refreshResults.push({
          platform: credential.platform,
          accountId: credential.account_id,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Close Redis connection
    if (redis) {
      await redis.quit();
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: credentials?.length || 0,
        results: refreshResults,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Token refresh cron job failed:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
