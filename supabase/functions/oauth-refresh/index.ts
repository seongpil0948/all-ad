import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const platformTokenUrls: Record<string, string> = {
  google: "https://oauth2.googleapis.com/token",
  facebook: "https://graph.facebook.com/v18.0/oauth/access_token",
  kakao: "https://kauth.kakao.com/oauth/token",
  tiktok: "https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/",
};

async function refreshOAuthToken(
  platform: string,
  refreshToken: string,
  clientId: string,
  clientSecret: string,
): Promise<Record<string, unknown>> {
  const tokenUrl = platformTokenUrls[platform];
  if (!tokenUrl) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  let params: URLSearchParams;
  let headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  // TikTok uses different parameter names
  if (platform === "tiktok") {
    params = new URLSearchParams({
      app_id: clientId,
      secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });
  } else {
    params = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    });
  }

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers,
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  const data = await response.json();

  // TikTok returns data wrapped in a "data" field
  if (platform === "tiktok" && data.code === 0) {
    return data.data;
  }

  return data;
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { platform, credential_id, refresh_token } = await req.json();

    if (!platform || !credential_id || !refresh_token) {
      throw new Error("Missing required parameters");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the credential to find team_id
    const { data: credential, error: credError } = await supabase
      .from("platform_credentials")
      .select("team_id")
      .eq("id", credential_id)
      .single();

    if (credError || !credential) {
      throw new Error("Credential not found");
    }

    // Get team OAuth credentials
    const { data: teamCreds, error: teamError } = await supabase
      .from("team_credentials")
      .select("credentials")
      .eq("team_id", credential.team_id)
      .eq("platform", platform)
      .single();

    if (teamError || !teamCreds) {
      throw new Error("Team OAuth credentials not found");
    }

    // Refresh the token
    const tokenData = await refreshOAuthToken(
      platform,
      refresh_token,
      teamCreds.credentials.client_id,
      teamCreds.credentials.client_secret,
    );

    // Update the credential with new token data
    const { error: updateError } = await supabase
      .from("platform_credentials")
      .update({
        data: {
          oauth_tokens: {
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token || refresh_token,
            expires_at: new Date(
              Date.now() + ((tokenData.expires_in as number) || 3600) * 1000,
            ).toISOString(),
            token_type: tokenData.token_type || "Bearer",
            scope: tokenData.scope,
          },
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", credential_id);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        expires_in: tokenData.expires_in,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
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
