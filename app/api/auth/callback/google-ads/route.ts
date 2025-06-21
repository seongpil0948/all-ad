import type { OAuthConfig } from "@/types/oauth";

import { NextRequest } from "next/server";

import {
  handleUnifiedOAuthCallback,
  standardTokenExchange,
} from "@/lib/oauth/unified-oauth-handler";
import { getOAuthConfig } from "@/lib/oauth/platform-configs";
import { createClient } from "@/utils/supabase/server";
import { OAuthManager } from "@/lib/oauth/oauth-manager";
import log from "@/utils/logger";

export async function GET(request: NextRequest) {
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

  // If OAuth was successful, we need to fetch Google Ads accounts
  const url = new URL(response.url);

  if (url.searchParams.get("success") === "oauth_connected") {
    try {
      // Parse the state to get user and team info
      const state = request.nextUrl.searchParams.get("state");

      if (!state) return response;

      const stateData = JSON.parse(Buffer.from(state, "base64").toString());
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

        // Use a temporary account ID for now
        // In a real implementation, you would fetch Google Ads accounts here
        const tempAccountId = `google_${teamId}_${Date.now()}`;

        // Get the access token we just stored
        const accessToken = await oauthManager.getValidAccessToken(
          userId,
          tempAccountId,
        );

        if (accessToken) {
          // TODO: Fetch actual Google Ads accounts using the access token
          // For now, we'll just update the credential with a success status
          await supabase
            .from("platform_credentials")
            .update({
              is_active: true,
              last_synced_at: new Date().toISOString(),
              data: {
                ...credential.data,
                oauth_connected: true,
                connected_at: new Date().toISOString(),
              },
            })
            .eq("id", credential.id);
        }
      }
    } catch (error) {
      log.error("Failed to process Google Ads post-OAuth setup:", error);
    }
  }

  return response;
}
