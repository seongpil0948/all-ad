import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createClient as createRedisClient } from "https://esm.sh/@redis/client@1.6.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Google OAuth token refresh function
async function refreshGoogleToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string,
): Promise<{
  success: boolean;
  access_token?: string;
  expires_at?: number;
  error?: string;
}> {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Token refresh failed:", errorText);
      return { success: false, error: errorText };
    }

    const data = await response.json();
    const expiresAt = Date.now() + (data.expires_in || 3600) * 1000;

    return {
      success: true,
      access_token: data.access_token,
      expires_at: expiresAt,
    };
  } catch (error) {
    console.error("Token refresh error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

interface GoogleAdsAccountRecord {
  id: string;
  team_id: string;
  platform: string;
  account_id: string;
  account_name: string;
  credentials: {
    client_id: string;
    client_secret: string;
  };
  is_active: boolean;
  user_id?: string;
  created_by?: string;
  data?: {
    developer_token?: string;
    refresh_token?: string;
    login_customer_id?: string;
    customer_id?: string;
    oauth_tokens?: {
      access_token: string;
      expires_at: number;
      refresh_token?: string;
    };
  };
  last_synced_at?: string | null;
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("Starting Google Ads incremental sync (hourly cron)");

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Initialize Redis client
    const redisUrl = Deno.env.get("REDIS_URL");
    let redis: ReturnType<typeof createRedisClient> | null = null;
    if (redisUrl) {
      try {
        redis = createRedisClient({
          url: redisUrl,
        });
        await redis.connect();
        console.log("Redis connected successfully");
      } catch (error) {
        console.error("Redis connection failed:", error);
        // Continue without Redis - will use database fallback
      }
    }

    // Get all active Google Ads credentials
    const { data: accounts, error: credError } = await supabase
      .from("platform_credentials")
      .select("*")
      .eq("platform", "google")
      .eq("is_active", true);

    if (credError) {
      throw credError;
    }

    console.log(`INCREMENTAL sync target accounts: ${accounts?.length || 0}`);

    const results: Array<{
      accountId: string;
      accountName: string;
      status: string;
      campaigns_synced?: number;
      error?: string;
    }> = [];

    // Process each Google Ads account
    for (const account of accounts || []) {
      let customerId: string | undefined;
      try {
        // Get OAuth access token from Redis or database
        const userId = account.user_id || account.created_by;
        if (!userId) {
          console.warn(
            `Skipping Google Ads account without user_id: ${account.id}`,
          );
          continue;
        }

        const tokenKey = `oauth:google:${userId}:${account.account_id}:tokens`;
        let tokens: {
          access_token: string;
          expires_at?: number;
          refresh_token?: string;
        } | null = null;

        // Try to get token from Redis first
        if (redis) {
          try {
            const tokenData = await redis.get(tokenKey);
            if (tokenData) {
              tokens = JSON.parse(tokenData);
            }
          } catch (error) {
            console.warn(`Failed to get token from Redis: ${error}`);
          }
        }

        // Fall back to database
        if (!tokens && account.data?.oauth_tokens) {
          tokens = account.data.oauth_tokens;
        }

        // If no tokens found, try to refresh using refresh_token from data
        if (!tokens || !tokens.access_token) {
          const refreshToken = account.data?.refresh_token;
          if (!refreshToken) {
            console.warn(
              `No access token or refresh token found for Google Ads account: ${account.id}`,
            );
            continue;
          }

          console.log(
            `No access token found, attempting to refresh for account: ${account.id}`,
          );

          // Refresh the token
          const tokenRefreshed = await refreshGoogleToken(
            account.credentials.client_id,
            account.credentials.client_secret,
            refreshToken,
          );

          if (!tokenRefreshed.success) {
            console.error(`Failed to refresh token: ${tokenRefreshed.error}`);
            continue;
          }

          tokens = {
            access_token: tokenRefreshed.access_token!,
            expires_at: tokenRefreshed.expires_at!,
            refresh_token: refreshToken,
          };

          // Store refreshed token in Redis
          if (redis) {
            try {
              await redis.set(
                tokenKey,
                JSON.stringify(tokens),
                { EX: 3600 }, // Expire in 1 hour
              );
              console.log(
                `Stored refreshed token in Redis for account: ${account.id}`,
              );
            } catch (error) {
              console.warn(
                `Failed to store refreshed token in Redis: ${error}`,
              );
            }
          }
        }

        // Check if token needs refresh (5 minutes buffer)
        const now = Date.now();
        if (
          tokens &&
          tokens.expires_at &&
          tokens.expires_at - now < 5 * 60 * 1000
        ) {
          console.log(`Token needs refresh for account: ${account.id}`);

          const storedRefreshToken = account.data?.refresh_token;
          if (!storedRefreshToken) {
            console.error(
              `No refresh token available for account: ${account.id}`,
            );
            continue;
          }

          // Refresh the token directly
          const tokenRefreshed = await refreshGoogleToken(
            account.credentials.client_id,
            account.credentials.client_secret,
            storedRefreshToken,
          );

          if (!tokenRefreshed.success) {
            console.error(
              `Failed to refresh token for account ${account.id}: ${tokenRefreshed.error}`,
            );
            continue;
          }

          tokens = {
            access_token: tokenRefreshed.access_token!,
            expires_at: tokenRefreshed.expires_at!,
            refresh_token: storedRefreshToken,
          };

          // Store refreshed token in Redis
          if (redis) {
            try {
              await redis.set(
                tokenKey,
                JSON.stringify(tokens),
                { EX: 3600 }, // Expire in 1 hour
              );
              console.log(
                `Updated refreshed token in Redis for account: ${account.id}`,
              );
            } catch (error) {
              console.warn(
                `Failed to update refreshed token in Redis: ${error}`,
              );
            }
          }
        }

        // Get developer token and refresh token from data field
        const developerToken = account.data?.developer_token;
        const refreshToken =
          account.data?.refresh_token || tokens?.refresh_token;

        if (!developerToken || !refreshToken) {
          console.warn(
            `Missing developer token or refresh token for account: ${account.id}`,
          );
          continue;
        }

        // Extract customer ID from account_id (format: google_<timestamp>_<customerId>)
        const customerIdMatch = account.account_id.match(/google_\d+_(.+)$/);
        customerId = customerIdMatch
          ? customerIdMatch[1]
          : account.data?.customer_id;

        if (!customerId) {
          console.warn(`No customer ID found for account: ${account.id}`);
          continue;
        }

        // Prepare credentials for sync
        const credentials = {
          clientId: account.credentials.client_id,
          clientSecret: account.credentials.client_secret,
          refreshToken: refreshToken,
          accessToken: tokens?.access_token || "",
          developerToken: developerToken,
          customerId: customerId,
          loginCustomerId: account.data?.login_customer_id,
        };

        // Call platform-sync endpoint for actual sync
        const syncUrl = `${supabaseUrl}/functions/v1/platform-sync`;
        const syncResponse = await fetch(syncUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${supabaseServiceKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            platform: "google",
            team_id: account.team_id,
            credential_id: account.id,
            sync_type: "incremental",
            credentials: credentials,
            account_info: {
              customerId: customerId,
              accountName: account.account_name,
            },
          }),
        });

        if (!syncResponse.ok) {
          const errorText = await syncResponse.text();
          throw new Error(`Failed to sync: ${errorText}`);
        }

        const syncResult = await syncResponse.json();

        results.push({
          accountId: customerId,
          accountName: account.account_name,
          status: "synced",
          campaigns_synced: syncResult.campaigns_count || 0,
        });

        console.log(`Sync completed: ${account.account_name}`, {
          accountId: customerId,
          syncType: "INCREMENTAL",
        });
      } catch (error) {
        console.error(`Failed to sync account: ${account.account_name}`, error);

        results.push({
          accountId: customerId || account.account_id,
          accountName: account.account_name,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Close Redis connection
    if (redis) {
      try {
        await redis.disconnect();
      } catch (error) {
        console.warn("Failed to disconnect Redis:", error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        syncType: "INCREMENTAL",
        timestamp: new Date().toISOString(),
        processed: results.length,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Google Ads incremental sync cron job failed:", error);

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
