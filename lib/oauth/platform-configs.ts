// Server-side only OAuth configuration functions
import type { OAuthConfig } from "@/types/oauth";

import { createClient } from "@/utils/supabase/server";

// Client config export removed - legacy OAuth implementation

// Base OAuth configurations (without client credentials)
const baseOAuthConfigs = {
  google: {
    redirectUri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback/google-ads`,
    scope: [
      "https://www.googleapis.com/auth/adwords",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
    authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    accessType: "offline",
    prompt: "consent select_account",
  },
  facebook: {
    redirectUri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback/facebook-ads`,
    scope: ["ads_management", "ads_read", "business_management"],
    authorizationUrl: "https://www.facebook.com/v23.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v23.0/oauth/access_token",
  },
  meta: {
    redirectUri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback/meta-ads`,
    scope: [
      "ads_management",
      "ads_read",
      "business_management",
      "pages_read_engagement",
    ],
    authorizationUrl: "https://www.facebook.com/v23.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v23.0/oauth/access_token",
  },
  kakao: {
    redirectUri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback/kakao-ads`,
    scope: ["moment:read", "moment:write"],
    authorizationUrl: "https://kauth.kakao.com/oauth/authorize",
    tokenUrl: "https://kauth.kakao.com/oauth/token",
  },
  amazon: {
    redirectUri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback/amazon-ads`,
    scope: ["advertising::campaign_management"],
    authorizationUrl: "https://www.amazon.com/ap/oa",
    tokenUrl: "https://api.amazon.com/auth/o2/token",
  },
  tiktok: {
    redirectUri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback/tiktok-ads`,
    scope: [
      "ad.group.read",
      "ad.group.write",
      "campaign.read",
      "campaign.write",
    ],
    authorizationUrl:
      "https://business-api.tiktok.com/open_api/v1.3/oauth2/authorize/",
    tokenUrl:
      "https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/",
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

// Get OAuth config with Sivera's own credentials (for simplified OAuth)
export async function getAllAdOAuthConfig(
  platform: string,
): Promise<OAuthConfig | null> {
  const baseConfig =
    baseOAuthConfigs[platform as keyof typeof baseOAuthConfigs];

  if (!baseConfig) {
    return null;
  }

  // Use Sivera's own OAuth credentials from environment variables
  const credentialMap = {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      developerToken: process.env.GOOGLE_DEVELOPER_TOKEN,
    },
    facebook: {
      clientId: process.env.META_CLIENT_ID,
      clientSecret: process.env.META_CLIENT_SECRET,
    },
    meta: {
      clientId: process.env.META_CLIENT_ID,
      clientSecret: process.env.META_CLIENT_SECRET,
    },
    // Add more platforms as needed
  };

  const platformCreds = credentialMap[platform as keyof typeof credentialMap];

  if (!platformCreds?.clientId || !platformCreds?.clientSecret) {
    return null;
  }

  return {
    ...baseConfig,
    clientId: platformCreds.clientId,
    clientSecret: platformCreds.clientSecret,
    ...(platform === "google" &&
    "developerToken" in platformCreds &&
    platformCreds.developerToken
      ? { developerToken: platformCreds.developerToken }
      : {}),
  };
}
