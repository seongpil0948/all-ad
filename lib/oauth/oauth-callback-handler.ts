import type { OAuthConfig } from "@/types/oauth";
import type { PlatformType } from "@/types";

import { NextRequest, NextResponse } from "next/server";

import { OAuthManager } from "@/lib/oauth/oauth-manager";
import log from "@/utils/logger";

export interface OAuthCallbackParams {
  platform: PlatformType;
  getOAuthConfig: (teamId: string) => Promise<OAuthConfig | null>;
  exchangeCodeForToken: (
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
 * Generic OAuth callback handler for all platforms
 */
export async function handleOAuthCallback(
  request: NextRequest,
  params: OAuthCallbackParams,
): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const settingsUrl = `${baseUrl}/settings`;

  try {
    // Handle OAuth errors
    if (error) {
      log.error(`${params.platform} OAuth error`, {
        error,
        errorDescription,
      });

      return NextResponse.redirect(
        `${settingsUrl}?error=oauth_denied&platform=${params.platform}`,
      );
    }

    // Validate required parameters
    if (!code || !state) {
      log.warn(`${params.platform} OAuth callback missing parameters`, {
        hasCode: !!code,
        hasState: !!state,
      });

      return NextResponse.redirect(
        `${settingsUrl}?error=invalid_callback&platform=${params.platform}`,
      );
    }

    // Validate state if custom validation provided
    if (params.validateState) {
      const isValidState = await params.validateState(state);

      if (!isValidState) {
        log.warn(`${params.platform} OAuth invalid state`, { state });

        return NextResponse.redirect(
          `${settingsUrl}?error=invalid_state&platform=${params.platform}`,
        );
      }
    }

    // Parse state to get team ID
    let teamId: string;

    try {
      const stateData = JSON.parse(Buffer.from(state, "base64").toString());

      teamId = stateData.teamId;

      if (!teamId) {
        throw new Error("Team ID not found in state");
      }
    } catch (error) {
      log.error(`${params.platform} OAuth state parsing error`, error);

      return NextResponse.redirect(
        `${settingsUrl}?error=invalid_state&platform=${params.platform}`,
      );
    }

    // Get OAuth configuration
    const oauthConfig = await params.getOAuthConfig(teamId);

    if (!oauthConfig) {
      log.error(`${params.platform} OAuth config not found`, { teamId });

      return NextResponse.redirect(
        `${settingsUrl}?error=config_not_found&platform=${params.platform}`,
      );
    }

    // Exchange code for token
    try {
      const tokenData = await params.exchangeCodeForToken(code, oauthConfig);

      // Save token to database
      const oauthManager = new OAuthManager(params.platform, oauthConfig);

      await oauthManager.storeTokens(teamId, params.platform, {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in || 3600,
        token_type: "Bearer",
      });

      log.info(`${params.platform} OAuth successful`, {
        teamId,
        hasRefreshToken: !!tokenData.refresh_token,
      });

      return NextResponse.redirect(
        `${settingsUrl}?success=oauth_connected&platform=${params.platform}`,
      );
    } catch (error) {
      log.error(`${params.platform} token exchange error`, error);

      return NextResponse.redirect(
        `${settingsUrl}?error=token_exchange_failed&platform=${params.platform}`,
      );
    }
  } catch (error) {
    log.error(`${params.platform} OAuth callback error`, error);

    return NextResponse.redirect(
      `${settingsUrl}?error=oauth_error&platform=${params.platform}`,
    );
  }
}

/**
 * Standard OAuth token exchange
 */
export async function standardTokenExchange(
  code: string,
  config: OAuthConfig,
  tokenUrl: string,
  additionalParams?: Record<string, string>,
): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}> {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    ...additionalParams,
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(`Token exchange failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
  };
}
