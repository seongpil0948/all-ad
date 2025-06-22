import type { OAuthConfig } from "@/types/oauth";
import type { PlatformType } from "@/types";

import { NextRequest, NextResponse } from "next/server";

import { OAuthManager } from "@/lib/oauth/oauth-manager";
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
    params.environment === "lab" ? `${baseUrl}/lab` : `${baseUrl}/integrated`;

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

      // Save token to database
      const oauthManager = new OAuthManager(params.platform, oauthConfig);

      // For Google Ads, we need to get the customer ID later
      // For now, we'll use a temporary account ID
      const accountId = `${params.platform}_${teamId}_${Date.now()}`;

      await oauthManager.storeTokens(userId, accountId, {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in || 3600,
        token_type: "Bearer",
      });

      log.info(`${params.platform} OAuth successful`, {
        teamId,
        userId,
        accountId,
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
 * Standard OAuth token exchange
 * (Re-exported from oauth-callback-handler for backward compatibility)
 */
export { standardTokenExchange } from "./oauth-callback-handler";
