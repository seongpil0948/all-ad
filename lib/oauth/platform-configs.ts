// Server-side only OAuth configuration functions
import { OAuthConfig } from "./oauth-client";

import { createClient } from "@/utils/supabase/server";

// Re-export client config for convenience
export { getOAuthConfig } from "./platform-configs.client";

// Base OAuth configurations (without client credentials)
const baseOAuthConfigs = {
  google: {
    redirectUri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback/google-ads`,
    scope: ["https://www.googleapis.com/auth/adwords"],
    authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
  },
  facebook: {
    redirectUri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback/facebook-ads`,
    scope: ["ads_management", "ads_read", "business_management"],
    authorizationUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
  },
  kakao: {
    redirectUri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback/kakao-ads`,
    scope: ["moment:read", "moment:write"],
    authorizationUrl: "https://kauth.kakao.com/oauth/authorize",
    tokenUrl: "https://kauth.kakao.com/oauth/token",
  },
};

// Get OAuth config with credentials from database
export async function getOAuthConfigWithCredentials(
  platform: string,
  teamId: string,
): Promise<OAuthConfig | null> {
  const baseConfig =
    baseOAuthConfigs[platform as keyof typeof baseOAuthConfigs];

  if (!baseConfig) {
    return null;
  }

  const supabase = await createClient();

  // Get the stored OAuth credentials for this team and platform
  const { data: credential, error } = await supabase
    .from("platform_credentials")
    .select("credentials, data")
    .eq("team_id", teamId)
    .eq("platform", platform)
    .single();

  if (error || !credential) {
    return null;
  }

  // Extract OAuth credentials from stored data
  const { client_id, client_secret } = credential.credentials || {};
  const { developer_token } = credential.data || {};

  if (!client_id || !client_secret) {
    return null;
  }

  return {
    clientId: client_id,
    clientSecret: client_secret,
    ...baseConfig,
    // Include developer token for Google Ads
    ...(platform === "google" && developer_token
      ? { developerToken: developer_token }
      : {}),
  };
}
