import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

import { createClient } from "@/utils/supabase/server";
import log from "@/utils/logger";

const AMAZON_TOKEN_URL = "https://api.amazon.com/auth/o2/token";

interface AmazonTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

interface AmazonProfile {
  profileId: string;
  profileType: string;
  countryCode: string;
  currencyCode: string;
  timezone: string;
  marketplaceStringId: string;
  accountInfo: {
    marketplaceStringId: string;
    sellerStringId: string;
    type: string;
    name: string;
    validPaymentMethod: boolean;
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // OAuth 에러 처리
    if (error) {
      log.error("Amazon OAuth error", { error });

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/en/settings?error=oauth_cancelled&platform=amazon`,
      );
    }

    if (!code || !state) {
      log.error("Missing code or state in Amazon OAuth callback");

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/en/settings?error=invalid_oauth_response&platform=amazon`,
      );
    }

    const supabase = await createClient();

    // State 검증 및 사용자 정보 조회
    const { data: oauthState } = await supabase
      .from("oauth_states")
      .select("*")
      .eq("state", state)
      .eq("platform", "amazon")
      .single();

    if (!oauthState) {
      log.error("Invalid OAuth state for Amazon", { state });

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/en/settings?error=invalid_oauth_response&platform=amazon&message=${encodeURIComponent("Invalid state parameter")}`,
      );
    }

    // State 삭제 (일회용)
    await supabase.from("oauth_states").delete().eq("id", oauthState.id);

    // 1. 토큰 교환
    const tokenResponse = await exchangeCodeForTokens(code);

    // 2. 프로필 정보 조회
    const profiles = await getAmazonProfiles(tokenResponse.access_token);

    if (profiles.length === 0) {
      log.error("No Amazon Advertising profiles found");

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/en/settings?error=oauth_failed&platform=amazon&message=${encodeURIComponent("No Amazon Advertising profiles found")}`,
      );
    }

    // 3. 각 프로필에 대해 자격 증명 저장
    for (const profile of profiles) {
      const credentials = {
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        profile_id: profile.profileId,
        profile_type: profile.profileType,
        country_code: profile.countryCode,
        currency_code: profile.currencyCode,
        timezone: profile.timezone,
        marketplace_id: profile.marketplaceStringId,
        account_info: profile.accountInfo,
      };

      await supabase.from("platform_credentials").upsert(
        {
          team_id: oauthState.team_id,
          created_by: oauthState.user_id,
          platform: "amazon",
          account_id: profile.profileId,
          account_name:
            profile.accountInfo?.name || `Amazon Profile ${profile.profileId}`,
          credentials,
          access_token: tokenResponse.access_token,
          refresh_token: tokenResponse.refresh_token,
          expires_at: new Date(
            Date.now() + tokenResponse.expires_in * 1000,
          ).toISOString(),
          scope: "advertising::campaign_management",
          is_active: true,
        },
        {
          onConflict: "team_id,platform,account_id",
        },
      );
    }

    log.info("Amazon Ads OAuth successful", {
      userId: oauthState.user_id,
      teamId: oauthState.team_id,
      profileCount: profiles.length,
    });

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/en/settings?success=platform_connected&platform=amazon&account=${encodeURIComponent(profiles[0]?.accountInfo?.name || `Amazon Profile ${profiles[0]?.profileId}`)}`,
    );
  } catch (error) {
    log.error("Amazon Ads OAuth callback error", { error });

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/en/settings?error=oauth_failed&platform=amazon&message=${encodeURIComponent("Amazon OAuth integration failed")}`,
    );
  }
}

async function exchangeCodeForTokens(
  code: string,
): Promise<AmazonTokenResponse> {
  try {
    const response = await axios.post(
      AMAZON_TOKEN_URL,
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback/amazon-ads`,
        client_id: process.env.AMAZON_CLIENT_ID!,
        client_secret: process.env.AMAZON_CLIENT_SECRET!,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    return response.data;
  } catch (error: any) {
    log.error("Amazon token exchange failed", {
      error: error.response?.data || error.message,
    });
    throw new Error("Failed to exchange code for tokens");
  }
}

async function getAmazonProfiles(
  accessToken: string,
): Promise<AmazonProfile[]> {
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

    return response.data;
  } catch (error: any) {
    log.error("Failed to fetch Amazon profiles", {
      error: error.response?.data || error.message,
    });
    throw new Error("Failed to fetch Amazon profiles");
  }
}
