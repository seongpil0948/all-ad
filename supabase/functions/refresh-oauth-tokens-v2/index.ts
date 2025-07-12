/* eslint-disable no-console */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TokenRefreshResult {
  platform: string;
  accountId: string;
  status: "refreshed" | "failed" | "not_needed" | "skipped";
  error?: string;
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Get Sivera OAuth credentials from environment
    const googleClientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const googleClientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all active platform credentials that need refresh
    // Only check top-level expires_at column
    const { data: credentials, error } = await supabase
      .from("platform_credentials")
      .select("*")
      .in("platform", ["google", "facebook", "kakao"])
      .eq("is_active", true)
      .not("refresh_token", "is", null)
      .not("expires_at", "is", null)
      .lt("expires_at", new Date(Date.now() + 30 * 60 * 1000).toISOString());

    if (error) {
      throw error;
    }

    const refreshResults: TokenRefreshResult[] = [];

    for (const credential of credentials || []) {
      try {
        // Get refresh token from top-level column only
        if (!credential.refresh_token) {
          console.warn(
            `No refresh token found for ${credential.platform}:${credential.account_id}`,
          );
          refreshResults.push({
            platform: credential.platform,
            accountId: credential.account_id,
            status: "skipped",
            error: "No refresh token",
          });
          continue;
        }

        const refreshToken = credential.refresh_token;

        // Platform-specific token refresh logic
        let newTokenData: any = null;

        switch (credential.platform) {
          case "google":
            // Use Sivera's OAuth credentials if available
            const clientId =
              googleClientId || credential.credentials?.client_id;
            const clientSecret =
              googleClientSecret || credential.credentials?.client_secret;

            if (!clientId || !clientSecret) {
              throw new Error("Missing OAuth client credentials");
            }

            newTokenData = await refreshGoogleToken(
              clientId,
              clientSecret,
              refreshToken,
            );
            break;

          case "facebook":
            newTokenData = await refreshFacebookToken(
              credential.credentials?.client_id as string,
              credential.credentials?.client_secret as string,
              refreshToken,
            );
            break;

          case "kakao":
            newTokenData = await refreshKakaoToken(
              credential.credentials?.client_id as string,
              credential.credentials?.client_secret as string,
              refreshToken,
            );
            break;
        }

        if (newTokenData) {
          // Update top-level columns only
          const updateData: any = {
            access_token: newTokenData.access_token,
            expires_at: new Date(newTokenData.expires_at).toISOString(),
            scope: newTokenData.scope,
            updated_at: new Date().toISOString(),
          };

          // Include new refresh token if provided
          if (newTokenData.refresh_token) {
            updateData.refresh_token = newTokenData.refresh_token;
          }

          await supabase
            .from("platform_credentials")
            .update(updateData)
            .eq("id", credential.id);

          refreshResults.push({
            platform: credential.platform,
            accountId: credential.account_id,
            status: "refreshed",
          });

          console.log(
            `Successfully refreshed token for ${credential.platform}:${credential.account_id}`,
          );
        }
      } catch (error) {
        console.error(`Error refreshing credential ${credential.id}:`, error);

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

    // Log results
    const refreshedCount = refreshResults.filter(
      (r) => r.status === "refreshed",
    ).length;
    const failedCount = refreshResults.filter(
      (r) => r.status === "failed",
    ).length;

    console.log(
      `Token refresh completed: ${refreshedCount} refreshed, ${failedCount} failed`,
    );

    return new Response(
      JSON.stringify({
        success: true,
        processed: credentials?.length || 0,
        refreshed: refreshedCount,
        failed: failedCount,
        results: refreshResults,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Token refresh job error:", error);

    return new Response(
      JSON.stringify({
        success: false,
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
  clientId: string,
  clientSecret: string,
  refreshToken: string,
): Promise<any> {
  const params = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
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
    refresh_token: data.refresh_token, // Google may return a new refresh token
    expires_at: Date.now() + data.expires_in * 1000,
    token_type: data.token_type,
    scope: data.scope,
  };
}

async function refreshFacebookToken(
  clientId: string,
  clientSecret: string,
  currentToken: string,
): Promise<any> {
  // Facebook uses long-lived tokens that don't need frequent refresh
  // Exchange current token for a new long-lived token
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: clientId,
    client_secret: clientSecret,
    fb_exchange_token: currentToken,
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
    expires_at: Date.now() + (data.expires_in || 5184000) * 1000, // Default 60 days
    token_type: "bearer",
  };
}

async function refreshKakaoToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string,
): Promise<any> {
  const params = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
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
    refresh_token: data.refresh_token || refreshToken, // Kakao may not return new refresh token
    expires_at: Date.now() + data.expires_in * 1000,
    token_type: data.token_type,
    scope: data.scope,
  };
}
