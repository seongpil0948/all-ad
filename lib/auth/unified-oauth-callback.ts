import "server-only";

import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

import { createClient } from "@/utils/supabase/server";
import {
  OAUTH_CONFIGS,
  exchangeCodeForTokens,
  getPlatformAccountInfo,
} from "@/lib/auth/oauth-handlers";
import { PlatformType } from "@/types";
import log from "@/utils/logger";

interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

interface PlatformProfile {
  profileId?: string;
  accountId: string;
  accountName: string;
  email?: string;
  additionalData?: Record<string, any>;
}

export async function handleOAuthCallback(
  request: NextRequest,
  platform: PlatformType,
): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // OAuth 에러 처리
    if (error) {
      log.error(`${platform} OAuth error`, { error });

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/en/settings?error=oauth_cancelled&platform=${platform}`,
      );
    }

    if (!code || !state) {
      log.error(`Missing code or state in ${platform} OAuth callback`);

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/en/settings?error=invalid_oauth_response&platform=${platform}`,
      );
    }

    const supabase = await createClient();

    // State 검증 및 사용자 정보 조회
    const { data: oauthState } = await supabase
      .from("oauth_states")
      .select("*")
      .eq("state", state)
      .eq("platform", platform)
      .single();

    if (!oauthState) {
      log.error(`Invalid OAuth state for ${platform}`, { state });

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/en/settings?error=invalid_oauth_response&platform=${platform}&message=${encodeURIComponent("Invalid state parameter")}`,
      );
    }

    // State 삭제 (일회용)
    await supabase.from("oauth_states").delete().eq("id", oauthState.id);

    // 1. 토큰 교환
    const tokenResponse = await exchangeTokens(platform, code, state);

    // 2. 프로필 정보 조회
    const profiles = await getPlatformProfiles(platform, tokenResponse);

    if (profiles.length === 0) {
      log.error(`No ${platform} profiles found`);

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/en/settings?error=oauth_failed&platform=${platform}&message=${encodeURIComponent(`No ${platform} profiles found`)}`,
      );
    }

    // 3. 각 프로필에 대해 자격 증명 저장
    for (const profile of profiles) {
      await saveCredentials(
        supabase,
        platform,
        oauthState,
        tokenResponse,
        profile,
      );
    }

    log.info(`${platform} OAuth successful`, {
      userId: oauthState.user_id,
      teamId: oauthState.team_id,
      profileCount: profiles.length,
    });

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/en/settings?success=platform_connected&platform=${platform}&account=${encodeURIComponent(profiles[0]?.accountName || `${platform} Profile`)}`,
    );
  } catch (error) {
    log.error(`${platform} OAuth callback error`, { error });

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/en/settings?error=oauth_failed&platform=${platform}&message=${encodeURIComponent(`${platform} OAuth integration failed`)}`,
    );
  }
}

async function exchangeTokens(
  platform: PlatformType,
  code: string,
  state: string,
): Promise<OAuthTokenResponse> {
  const clientId = getClientId(platform);
  const clientSecret = getClientSecret(platform);
  const redirectUri = getRedirectUri(platform);

  if (!clientId || !clientSecret) {
    throw new Error(`OAuth credentials not configured for ${platform}`);
  }

  // Use the existing exchangeCodeForTokens function for consistency
  const tokens = await exchangeCodeForTokens(
    platform,
    code,
    state,
    redirectUri,
    clientId,
    clientSecret,
  );

  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_type: "Bearer",
    expires_in: tokens.expires_in || 3600,
    scope: tokens.scope,
  };
}

async function getPlatformProfiles(
  platform: PlatformType,
  tokenResponse: OAuthTokenResponse,
): Promise<PlatformProfile[]> {
  try {
    // For most platforms, get account info using the unified handler
    const accountInfo = await getPlatformAccountInfo(
      platform,
      tokenResponse.access_token,
    );

    return [
      {
        accountId: accountInfo.accountId,
        accountName: accountInfo.accountName,
        email: accountInfo.email,
      },
    ];
  } catch (error) {
    // For Amazon, handle special cases
    if (platform === "amazon") {
      return await getAmazonProfiles(tokenResponse.access_token);
    }

    log.error(`Failed to get ${platform} profiles`, { error });
    throw error;
  }
}

async function getAmazonProfiles(
  accessToken: string,
): Promise<PlatformProfile[]> {
  try {
    // Try to get Amazon Advertising profiles first
    try {
      const response = await axios.get(
        "https://advertising-api.amazon.com/v2/profiles",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Amazon-Advertising-API-ClientId": process.env.AMAZON_CLIENT_ID!,
          },
        },
      );

      return response.data.map((profile: any) => ({
        profileId: profile.profileId,
        accountId: profile.profileId,
        accountName:
          profile.accountInfo?.name || `Amazon Profile ${profile.profileId}`,
        additionalData: profile,
      }));
    } catch (adsError) {
      // If advertising API fails, try basic profile API
      const response = await axios.get("https://api.amazon.com/user/profile", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return [
        {
          accountId: response.data.user_id || "amazon_user",
          accountName: response.data.name || "Amazon User",
          email: response.data.email,
          additionalData: response.data,
        },
      ];
    }
  } catch (error: any) {
    log.error("Failed to fetch Amazon profiles", {
      error: error.response?.data || error.message,
    });
    throw new Error("Failed to fetch Amazon profiles");
  }
}

async function saveCredentials(
  supabase: any,
  platform: PlatformType,
  oauthState: any,
  tokenResponse: OAuthTokenResponse,
  profile: PlatformProfile,
) {
  const credentials = {
    access_token: tokenResponse.access_token,
    refresh_token: tokenResponse.refresh_token,
    token_type: tokenResponse.token_type,
    expires_in: tokenResponse.expires_in,
    scope: tokenResponse.scope,
    ...profile.additionalData,
  };

  await supabase.from("platform_credentials").upsert(
    {
      team_id: oauthState.team_id,
      created_by: oauthState.user_id,
      platform: platform,
      account_id: profile.accountId,
      account_name: profile.accountName,
      credentials,
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token,
      expires_at: new Date(
        Date.now() + tokenResponse.expires_in * 1000,
      ).toISOString(),
      scope: tokenResponse.scope || OAUTH_CONFIGS[platform].scopes.join(" "),
      is_active: true,
    },
    {
      onConflict: "team_id,platform,account_id",
    },
  );
}

function getClientId(platform: PlatformType): string | undefined {
  switch (platform) {
    case "amazon":
      return process.env.AMAZON_CLIENT_ID;
    case "facebook":
      return process.env.FACEBOOK_CLIENT_ID;
    case "kakao":
      return process.env.KAKAO_CLIENT_ID;
    case "naver":
      return process.env.NAVER_CLIENT_ID;
    case "coupang":
      return process.env.COUPANG_CLIENT_ID;
    default:
      return undefined;
  }
}

function getClientSecret(platform: PlatformType): string | undefined {
  switch (platform) {
    case "amazon":
      return process.env.AMAZON_CLIENT_SECRET;
    case "facebook":
      return process.env.FACEBOOK_CLIENT_SECRET;
    case "kakao":
      return process.env.KAKAO_CLIENT_SECRET;
    case "naver":
      return process.env.NAVER_CLIENT_SECRET;
    case "coupang":
      return process.env.COUPANG_CLIENT_SECRET;
    default:
      return undefined;
  }
}

function getRedirectUri(platform: PlatformType): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return `${baseUrl}/api/auth/callback/${platform}-ads`;
}
