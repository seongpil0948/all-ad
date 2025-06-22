import type { OAuthConfig } from "@/types/oauth";

import { NextRequest, NextResponse } from "next/server";

import {
  handleUnifiedOAuthCallback,
  standardTokenExchange,
} from "@/lib/oauth/unified-oauth-handler";
import { getOAuthConfig } from "@/lib/oauth/platform-configs";
import { createClient } from "@/utils/supabase/server";
import { OAuthManager } from "@/lib/oauth/oauth-manager";
import log from "@/utils/logger";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Check for OAuth errors first
  if (error) {
    log.error("Google Ads OAuth error:", { error });
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    return NextResponse.redirect(
      `${baseUrl}/integrated?error=oauth_denied&platform=google`,
    );
  }

  // First, let the unified handler process the OAuth callback
  const response = await handleUnifiedOAuthCallback(request, {
    platform: "google",
    environment: "production",
    getOAuthConfig: async (_teamId: string): Promise<OAuthConfig | null> => {
      const config = getOAuthConfig("google");

      return config;
    },
    exchangeCodeForToken: async (code: string, config: OAuthConfig) => {
      return standardTokenExchange(
        code,
        config,
        "https://oauth2.googleapis.com/token",
      );
    },
  });

  // Check if OAuth was successful by looking at the response headers
  const location = response.headers.get("location");

  if (location && location.includes("success=oauth_connected")) {
    try {
      // Parse the state to get user and team info
      if (!state) return response;

      // State parameter comes as URL-encoded JSON, not base64
      const stateData = JSON.parse(decodeURIComponent(state));
      const { userId, teamId } = stateData;

      // Get the OAuth config with credentials
      const supabase = await createClient();
      const { data: credential } = await supabase
        .from("platform_credentials")
        .select("*")
        .eq("team_id", teamId)
        .eq("platform", "google")
        .single();

      if (credential) {
        // Get the stored token
        const config = getOAuthConfig("google");

        if (!config) return response;

        const oauthManager = new OAuthManager("google", {
          ...config,
          clientId: credential.credentials?.client_id || "",
          clientSecret: credential.credentials?.client_secret || "",
        });

        // The tokens were just stored by the unified handler
        // We need to fetch them from the temporary account ID used
        const tempAccountId = `google_${teamId}_${stateData.timestamp || Date.now()}`;

        // Get tokens from Redis using the temp account ID
        const storedTokens = await oauthManager.getValidAccessToken(
          userId,
          tempAccountId,
        );

        if (storedTokens) {
          // Also get the full token data from Redis to get refresh token
          const { getToken, setToken } = await import("@/lib/redis");
          const tokenKey = `oauth:google:${userId}:${tempAccountId}:tokens`;
          const fullTokenData = await getToken(tokenKey);

          let refreshToken: string | undefined;

          if (fullTokenData && typeof fullTokenData === "string") {
            const parsedTokens = JSON.parse(fullTokenData);

            refreshToken = parsedTokens.refresh_token;
          }

          // Generate the actual account ID
          const accountId = `google_${Date.now()}_xbwqz5erj`;

          // Update the credential with refresh token and account info
          const { error: updateError } = await supabase
            .from("platform_credentials")
            .update({
              is_active: true,
              account_id: accountId,
              account_name: `Google Ads Account ${new Date().toLocaleString()}`,
              user_id: userId,
              data: {
                ...credential.data,
                refresh_token: refreshToken,
                oauth_connected: true,
                connected_at: new Date().toISOString(),
              },
            })
            .eq("id", credential.id);

          if (updateError) {
            log.error("Failed to update credential:", updateError);
          } else {
            // Move tokens to the correct account ID in Redis
            if (fullTokenData && typeof fullTokenData === "string") {
              const newTokenKey = `oauth:google:${userId}:${accountId}:tokens`;

              await setToken(newTokenKey, fullTokenData, 3600);

              // Note: The temporary token will expire automatically (TTL)
            }

            log.info("Google Ads OAuth completed successfully", {
              teamId,
              userId,
              accountId,
              hasRefreshToken: !!refreshToken,
            });
          }
        }
      }
    } catch (error) {
      log.error("Failed to process Google Ads post-OAuth setup:", error);
    }
  }

  return response;
}
