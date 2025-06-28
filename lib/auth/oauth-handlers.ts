import "server-only";

import { PlatformType } from "@/types";
import log from "@/utils/logger";

// OAuth configuration for each platform
export const OAUTH_CONFIGS = {
  google: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: [
      "https://www.googleapis.com/auth/adwords",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  },
  facebook: {
    authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
    scopes: ["ads_management", "ads_read", "business_management"],
  },
  kakao: {
    authUrl: "https://kauth.kakao.com/oauth/authorize",
    tokenUrl: "https://kauth.kakao.com/oauth/token",
    scopes: ["moment:read", "moment:write"],
  },
  naver: {
    authUrl: "https://nid.naver.com/oauth2.0/authorize",
    tokenUrl: "https://nid.naver.com/oauth2.0/token",
    scopes: ["naver_search_ad"],
  },
  coupang: {
    // Coupang doesn't have public OAuth, this is placeholder
    authUrl: "",
    tokenUrl: "",
    scopes: [],
  },
} as const;

// OAuth state for CSRF protection
interface OAuthState {
  platform: PlatformType;
  teamId: string;
  redirectUri: string;
  state: string;
  timestamp: number;
}

// Generate OAuth URL for platform authentication
export async function generateOAuthUrl(
  platform: PlatformType,
  teamId: string,
  redirectUri: string,
  clientId: string,
): Promise<string> {
  const config = OAUTH_CONFIGS[platform];

  if (!config.authUrl) {
    throw new Error(`OAuth not supported for platform: ${platform}`);
  }

  // Generate CSRF state
  const state = btoa(
    JSON.stringify({
      platform,
      teamId,
      redirectUri,
      state: crypto.randomUUID(),
      timestamp: Date.now(),
    }),
  );

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: config.scopes.join(" "),
    state,
    access_type: "offline", // For refresh tokens
    prompt: "consent", // Force consent to get refresh token
  });

  const url = `${config.authUrl}?${params.toString()}`;

  log.info("Generated OAuth URL", { platform, teamId });

  return url;
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(
  platform: PlatformType,
  code: string,
  state: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string,
): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
}> {
  const config = OAUTH_CONFIGS[platform];

  if (!config.tokenUrl) {
    throw new Error(`Token exchange not supported for platform: ${platform}`);
  }

  // Verify state
  let parsedState: OAuthState;

  try {
    parsedState = JSON.parse(atob(state));
  } catch {
    throw new Error("Invalid OAuth state");
  }

  if (parsedState.platform !== platform) {
    throw new Error("Platform mismatch in OAuth state");
  }

  // Check state timestamp (valid for 10 minutes)
  const stateAge = Date.now() - parsedState.timestamp;

  if (stateAge > 10 * 60 * 1000) {
    throw new Error("OAuth state expired");
  }

  const tokenParams = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
  });

  try {
    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: tokenParams.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();

      log.error("Token exchange failed", {
        platform,
        status: response.status,
        error: errorText,
      });
      throw new Error(`Token exchange failed: ${response.status}`);
    }

    const tokens = await response.json();

    log.info("Token exchange successful", { platform });

    return tokens;
  } catch (error) {
    log.error("Error during token exchange", { platform, error });
    throw error;
  }
}

// Refresh access token using refresh token
export async function refreshAccessToken(
  platform: PlatformType,
  refreshToken: string,
  clientId: string,
  clientSecret: string,
): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}> {
  const config = OAUTH_CONFIGS[platform];

  if (!config.tokenUrl) {
    throw new Error(`Token refresh not supported for platform: ${platform}`);
  }

  const refreshParams = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });

  try {
    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: refreshParams.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();

      log.error("Token refresh failed", {
        platform,
        status: response.status,
        error: errorText,
      });
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const tokens = await response.json();

    log.info("Token refresh successful", { platform });

    return tokens;
  } catch (error) {
    log.error("Error during token refresh", { platform, error });
    throw error;
  }
}

// Get platform account information using access token
export async function getPlatformAccountInfo(
  platform: PlatformType,
  accessToken: string,
): Promise<{
  accountId: string;
  accountName: string;
  email?: string;
}> {
  let apiUrl: string;
  let headers: Record<string, string>;

  switch (platform) {
    case "google":
      apiUrl = "https://www.googleapis.com/oauth2/v2/userinfo";
      headers = { Authorization: `Bearer ${accessToken}` };
      break;
    case "facebook":
      apiUrl = "https://graph.facebook.com/v18.0/me?fields=id,name,email";
      headers = { Authorization: `Bearer ${accessToken}` };
      break;
    case "kakao":
      apiUrl = "https://kapi.kakao.com/v2/user/me";
      headers = { Authorization: `Bearer ${accessToken}` };
      break;
    case "naver":
      apiUrl = "https://openapi.naver.com/v1/nid/me";
      headers = { Authorization: `Bearer ${accessToken}` };
      break;
    default:
      throw new Error(`Account info not supported for platform: ${platform}`);
  }

  try {
    const response = await fetch(apiUrl, { headers });

    if (!response.ok) {
      throw new Error(`Failed to get account info: ${response.status}`);
    }

    const data = await response.json();

    // Transform response based on platform
    let accountInfo: { accountId: string; accountName: string; email?: string };

    switch (platform) {
      case "google":
        accountInfo = {
          accountId: data.id,
          accountName: data.name || data.email,
          email: data.email,
        };
        break;
      case "facebook":
        accountInfo = {
          accountId: data.id,
          accountName: data.name,
          email: data.email,
        };
        break;
      case "kakao":
        accountInfo = {
          accountId: String(data.id),
          accountName: data.kakao_account?.profile?.nickname || "Kakao User",
          email: data.kakao_account?.email,
        };
        break;
      case "naver":
        accountInfo = {
          accountId: data.response.id,
          accountName: data.response.name || data.response.nickname,
          email: data.response.email,
        };
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    log.info("Retrieved platform account info", {
      platform,
      accountId: accountInfo.accountId,
    });

    return accountInfo;
  } catch (error) {
    log.error("Error getting platform account info", { platform, error });
    throw error;
  }
}

// Remove the old helper functions as credentials are now user-provided

// Validate platform OAuth support
export function isPlatformOAuthSupported(platform: PlatformType): boolean {
  const config = OAUTH_CONFIGS[platform];

  return !!(config.authUrl && config.tokenUrl);
}

// Get human-readable platform name
export function getPlatformDisplayName(platform: PlatformType): string {
  switch (platform) {
    case "google":
      return "Google Ads";
    case "facebook":
      return "Meta Ads";
    case "kakao":
      return "카카오 모먼트";
    case "naver":
      return "네이버 검색광고";
    case "coupang":
      return "쿠팡 애즈";
    default:
      return platform;
  }
}
