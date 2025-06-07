import type { OAuthConfig } from "@/types/oauth";

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

// Get OAuth config by platform (base config without credentials)
export function getOAuthConfig(platform: string): OAuthConfig | null {
  const baseConfig =
    baseOAuthConfigs[platform as keyof typeof baseOAuthConfigs];

  if (!baseConfig) {
    return null;
  }

  // Return base config with empty credentials (will be filled from database)
  return {
    clientId: "",
    clientSecret: "",
    ...baseConfig,
  };
}
