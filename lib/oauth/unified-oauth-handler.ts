import type { OAuthConfig } from "@/types/oauth";
import type { PlatformType } from "@/types";

import { NextRequest, NextResponse } from "next/server";

// Legacy OAuth manager removed
import log from "@/utils/logger";

export type OAuthEnvironment = "production" | "lab";

export interface UnifiedOAuthCallbackParams {
  platform: PlatformType;
  environment: OAuthEnvironment;
  getOAuthConfig?: (teamId: string) => Promise<OAuthConfig | null>;
  exchangeCodeForToken?: (
    code: string,
    config: OAuthConfig,
  ) => Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  }>;
  validateState?: (state: string) => Promise<boolean>;
}

/**
 * Unified OAuth callback handler for both production and lab environments
 * This handler eliminates code duplication across platform-specific OAuth callbacks
 */
export async function handleUnifiedOAuthCallback(
  request: NextRequest,
  params: UnifiedOAuthCallbackParams,
): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // Determine redirect URL based on environment
  const redirectUrl =
    params.environment === "lab" ? `${baseUrl}/lab` : `${baseUrl}/dashboard`;

  try {
    // Handle OAuth errors
    if (error) {
      log.error(`${params.platform} OAuth error (${params.environment})`, {
        error,
        errorDescription,
        environment: params.environment,
      });

      if (params.environment === "lab") {
        // Lab environment: Pass error details back to the lab page
        const labUrl = new URL("/lab", request.url);

        labUrl.searchParams.set("error", error);
        if (errorDescription) {
          labUrl.searchParams.set("error_description", errorDescription);
        }
        labUrl.searchParams.set("platform", params.platform);

        return NextResponse.redirect(labUrl);
      } else {
        // Production environment: Redirect with error parameter
        return NextResponse.redirect(
          `${redirectUrl}?error=oauth_denied&platform=${params.platform}`,
        );
      }
    }

    // Validate required parameters
    if (!code) {
      log.warn(
        `${params.platform} OAuth callback missing code (${params.environment})`,
        {
          hasState: !!state,
          environment: params.environment,
        },
      );

      if (params.environment === "lab") {
        const labUrl = new URL("/lab", request.url);

        labUrl.searchParams.set("error", "missing_code");
        labUrl.searchParams.set("platform", params.platform);

        return NextResponse.redirect(labUrl);
      } else {
        return NextResponse.redirect(
          `${redirectUrl}?error=invalid_callback&platform=${params.platform}`,
        );
      }
    }

    // Lab environment: Just pass the code and state back to the lab page
    if (params.environment === "lab") {
      const labUrl = new URL("/lab", request.url);

      labUrl.searchParams.set("code", code);
      if (state) {
        labUrl.searchParams.set("state", state);
      }
      labUrl.searchParams.set("platform", params.platform);

      log.info(`${params.platform} Lab OAuth callback successful`, {
        platform: params.platform,
        hasCode: true,
        hasState: !!state,
      });

      return NextResponse.redirect(labUrl);
    }

    // Production environment: Process the OAuth flow completely
    if (!state) {
      log.warn(`${params.platform} OAuth callback missing state`, {
        environment: params.environment,
      });

      return NextResponse.redirect(
        `${redirectUrl}?error=invalid_callback&platform=${params.platform}`,
      );
    }

    // Validate state if custom validation provided
    if (params.validateState) {
      const isValidState = await params.validateState(state);

      if (!isValidState) {
        log.warn(`${params.platform} OAuth invalid state`, { state });

        return NextResponse.redirect(
          `${redirectUrl}?error=invalid_state&platform=${params.platform}`,
        );
      }
    }

    // Parse state to get team ID and user ID
    let teamId: string;
    let userId: string;

    try {
      // State parameter comes as URL-encoded JSON, not base64
      const stateData = JSON.parse(decodeURIComponent(state));

      teamId = stateData.teamId;
      userId = stateData.userId;

      if (!teamId || !userId) {
        throw new Error("Team ID or User ID not found in state");
      }
    } catch (error) {
      log.error(`${params.platform} OAuth state parsing error`, error);

      return NextResponse.redirect(
        `${redirectUrl}?error=invalid_state&platform=${params.platform}`,
      );
    }

    // Get OAuth configuration
    if (!params.getOAuthConfig) {
      throw new Error(
        "getOAuthConfig function is required for production environment",
      );
    }

    const oauthConfig = await params.getOAuthConfig(teamId);

    if (!oauthConfig) {
      log.error(`${params.platform} OAuth config not found`, { teamId });

      return NextResponse.redirect(
        `${redirectUrl}?error=config_not_found&platform=${params.platform}`,
      );
    }

    // Exchange code for token
    if (!params.exchangeCodeForToken) {
      throw new Error(
        "exchangeCodeForToken function is required for production environment",
      );
    }

    try {
      const tokenData = await params.exchangeCodeForToken(code, oauthConfig);

      // Store token in platform_credentials table
      await storeTokenData({
        teamId,
        userId,
        platform: params.platform,
        tokenData,
      });

      log.info(`${params.platform} OAuth successful`, {
        teamId,
        userId,
        // accountId: (tokenData as any).account_id,
        hasRefreshToken: !!tokenData.refresh_token,
      });

      return NextResponse.redirect(
        `${redirectUrl}?success=oauth_connected&platform=${params.platform}`,
      );
    } catch (error) {
      log.error(`${params.platform} token exchange error`, error);

      return NextResponse.redirect(
        `${redirectUrl}?error=token_exchange_failed&platform=${params.platform}`,
      );
    }
  } catch (error) {
    log.error(
      `${params.platform} OAuth callback error (${params.environment})`,
      error,
    );

    if (params.environment === "lab") {
      const errorUrl = new URL("/lab", request.url);

      errorUrl.searchParams.set("error", "callback_error");
      errorUrl.searchParams.set("platform", params.platform);

      return NextResponse.redirect(errorUrl);
    } else {
      return NextResponse.redirect(
        `${redirectUrl}?error=oauth_error&platform=${params.platform}`,
      );
    }
  }
}

/**
 * Store OAuth token data in the database
 */
async function storeTokenData({
  teamId,
  platform,
  tokenData,
  userId,
}: {
  teamId: string;
  platform: PlatformType;
  tokenData: {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };
  userId: string;
}) {
  const { createClient } = await import("@/utils/supabase/server");
  const supabase = await createClient();

  // Calculate expiration time
  const expiresAt = tokenData.expires_in
    ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    : null;

  // Get platform account information if available
  let accountId = "";
  let accountName = "";

  try {
    // For different platforms, we might need to make an API call to get account info
    // This is a simplified implementation
    if (platform === "google") {
      // For Google Ads, we might need to fetch customer ID
      accountId = "google-ads-account";
      accountName = "Google Ads Account";
    } else if (platform === "facebook") {
      // For Meta Ads, we might need to fetch ad account ID
      accountId = "meta-ads-account";
      accountName = "Meta Ads Account";
    } else if (platform === "kakao") {
      accountId = "kakao-account";
      accountName = "Kakao Moment Account";
    } else if (platform === "naver") {
      accountId = "naver-account";
      accountName = "Naver Search Ad Account";
    } else if (platform === "amazon") {
      accountId = "amazon-ads-account";
      accountName = "Amazon Ads Account";
    } else if (platform === "coupang") {
      accountId = "coupang-ads-account";
      accountName = "Coupang Ads Account";
    } else if (platform === "tiktok") {
      accountId = "tiktok-ads-account";
      accountName = "TikTok Ads Account";
    }
  } catch (error) {
    log.warn("Failed to fetch account info during token storage", {
      platform,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Check if credentials already exist for this team and platform
  const { data: existingCredentials } = await supabase
    .from("platform_credentials")
    .select("id")
    .eq("team_id", teamId)
    .eq("platform", platform)
    .eq("account_id", accountId)
    .single();

  if (existingCredentials) {
    // Update existing credentials
    const { error: updateError } = await supabase
      .from("platform_credentials")
      .update({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingCredentials.id);

    if (updateError) {
      log.error("Failed to update platform credentials", {
        platform,
        teamId,
        error: updateError,
      });
      throw new Error("Failed to update platform credentials");
    }

    log.info("Updated existing platform credentials", {
      platform,
      teamId,
      accountId,
    });
  } else {
    // Create new credentials
    const { error: insertError } = await supabase
      .from("platform_credentials")
      .insert({
        team_id: teamId,
        platform,
        account_id: accountId,
        account_name: accountName,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: userId, // Store user ID for tracking
      });

    if (insertError) {
      log.error("Failed to insert platform credentials", {
        platform,
        teamId,
        error: insertError,
      });
      throw new Error("Failed to store platform credentials");
    }

    log.info("Created new platform credentials", {
      platform,
      teamId,
      accountId,
    });
  }
}

/**
 * Standard OAuth token exchange
 * (Removed - legacy OAuth implementation)
 */
// export { standardTokenExchange } from "./oauth-callback-handler";
