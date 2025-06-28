/* eslint-disable no-console */
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TokenData {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
  token_type: string;
  scope?: string;
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    // const redisUrl = Deno.env.get("REDIS_URL")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
        // Skip if no OAuth credentials stored
        if (
          !credential.credentials?.client_id ||
          !credential.credentials?.client_secret
        ) {
          continue;
        }

        // Get tokens from Redis (would need Redis client for Deno)
        // For now, we'll assume tokens are stored in the data field
        const tokenData = credential.data?.tokens;

        if (!tokenData) {
          console.warn(
            `No token data found for ${credential.platform}:${credential.user_id}`,
          );
          continue;
        }

        const now = Date.now();
        const refreshBuffer = 30 * 60 * 1000; // 30 minutes before expiry

        // Check if token needs refresh
        if (
          tokenData.expires_at &&
          tokenData.expires_at - now < refreshBuffer
        ) {
          // Platform-specific token refresh logic
          let newTokenData: TokenData | null = null;

          switch (credential.platform) {
            case "google":
              newTokenData = await refreshGoogleToken(
                credential.credentials,
                tokenData.refresh_token,
              );
              break;
            case "facebook":
              newTokenData = await refreshFacebookToken(
                credential.credentials,
                tokenData.refresh_token,
              );
              break;
            case "kakao":
              newTokenData = await refreshKakaoToken(
                credential.credentials,
                tokenData.refresh_token,
              );
              break;
          }

          if (newTokenData) {
            // Update stored tokens in database
            await supabase
              .from("platform_credentials")
              .update({
                data: {
                  ...credential.data,
                  tokens: {
                    ...newTokenData,
                    refresh_token:
                      newTokenData.refresh_token || tokenData.refresh_token,
                  },
                },
                last_synced_at: new Date().toISOString(),
              })
              .eq("id", credential.id);

            refreshResults.push({
              platform: credential.platform,
              accountId: credential.account_id,
              status: "refreshed",
            });
          }
        } else {
          refreshResults.push({
            platform: credential.platform,
            accountId: credential.account_id,
            status: "not_needed",
          });
        }
      } catch (error) {
        console.error(`Error processing credential ${credential.id}:`, error);

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
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});

async function refreshGoogleToken(
  credentials: Record<string, unknown>,
  refreshToken: string,
): Promise<TokenData> {
  const params = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: credentials.client_id as string,
    client_secret: credentials.client_secret as string,
    grant_type: "refresh_token",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  if (!response.ok) {
    const error = await response.text();

    throw new Error(`Google token refresh failed: ${error}`);
  }

  const data = await response.json();

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
    token_type: data.token_type,
    scope: data.scope,
  };
}

async function refreshFacebookToken(
  credentials: Record<string, unknown>,
  refreshToken: string,
): Promise<TokenData> {
  // Facebook uses long-lived tokens that don't need refresh
  // But we can exchange for a new long-lived token
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: credentials.client_id as string,
    client_secret: credentials.client_secret as string,
    fb_exchange_token: refreshToken,
  });

  const response = await fetch(
    "https://graph.facebook.com/v23.0/oauth/access_token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    },
  );

  if (!response.ok) {
    const error = await response.text();

    throw new Error(`Facebook token refresh failed: ${error}`);
  }

  const data = await response.json();

  return {
    access_token: data.access_token,
    expires_at: Date.now() + data.expires_in * 1000,
    token_type: "bearer",
  };
}

async function refreshKakaoToken(
  credentials: Record<string, unknown>,
  refreshToken: string,
): Promise<TokenData> {
  const params = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: credentials.client_id as string,
    client_secret: credentials.client_secret as string,
    grant_type: "refresh_token",
  });

  const response = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  if (!response.ok) {
    const error = await response.text();

    throw new Error(`Kakao token refresh failed: ${error}`);
  }

  const data = await response.json();

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
    token_type: data.token_type,
    scope: data.scope,
  };
}
