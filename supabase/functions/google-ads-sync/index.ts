import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Redis } from "https://deno.land/x/redis@v0.31.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface GoogleAdsAccountRecord {
  id: string;
  team_id: string;
  platform: string;
  account_id: string;
  account_name: string;
  credentials: {
    client_id: string;
    client_secret: string;
    refresh_token: string;
    developer_token: string;
    login_customer_id?: string;
  };
  is_active: boolean;
  customer_id: string;
  user_id?: string;
  created_by?: string;
  data?: Record<string, unknown>;
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

    const results = [];

    // Process each Google Ads account
    for (const account of accounts || []) {
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
        let tokens = null;

        // Try to get token from Redis first
        if (redis) {
          const tokenData = await redis.get(tokenKey);
          if (tokenData) {
            tokens = JSON.parse(tokenData);
          }
        }

        // Fall back to database
        if (!tokens && account.data?.oauth_tokens) {
          tokens = account.data.oauth_tokens;
        }

        if (!tokens || !tokens.access_token) {
          console.warn(
            `No access token found for Google Ads account: ${account.id}`,
          );
          continue;
        }

        // Check if token needs refresh (5 minutes buffer)
        const now = Date.now();
        if (tokens.expires_at && tokens.expires_at - now < 5 * 60 * 1000) {
          console.log(`Token needs refresh for account: ${account.id}`);

          // Call refresh tokens endpoint
          const refreshResponse = await fetch(
            `${supabaseUrl}/functions/v1/refresh-tokens`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${supabaseServiceKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ trigger: "pre-sync" }),
            },
          );

          if (!refreshResponse.ok) {
            console.error(
              `Failed to refresh token: ${await refreshResponse.text()}`,
            );
            continue;
          }

          // Re-fetch token after refresh
          if (redis) {
            const tokenData = await redis.get(tokenKey);
            if (tokenData) {
              tokens = JSON.parse(tokenData);
            }
          }
        }

        // Prepare credentials for sync
        const credentials = {
          clientId: account.credentials.client_id,
          clientSecret: account.credentials.client_secret,
          refreshToken: account.credentials.refresh_token,
          accessToken: tokens.access_token,
          developerToken: account.credentials.developer_token,
          customerId: account.customer_id,
          loginCustomerId: account.credentials.login_customer_id,
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
              customerId: account.customer_id,
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
          accountId: account.customer_id,
          accountName: account.account_name,
          status: "synced",
          campaigns_synced: syncResult.campaigns_count || 0,
        });

        console.log(`Sync completed: ${account.account_name}`, {
          accountId: account.customer_id,
          syncType: "INCREMENTAL",
        });
      } catch (error) {
        console.error(`Failed to sync account: ${account.account_name}`, error);

        results.push({
          accountId: account.customer_id,
          accountName: account.account_name,
          status: "error",
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
