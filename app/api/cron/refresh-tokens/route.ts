import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import { OAuthManager } from "@/lib/oauth/oauth-manager";
import { getOAuthConfigWithCredentials } from "@/lib/oauth/platform-configs";
import { getRedisClient } from "@/lib/redis";
import log from "@/utils/logger";

// This endpoint can be called by Supabase cron job or Vercel cron
// The endpoint is protected by Supabase's service role key
export async function GET(_request: NextRequest) {
  // For Supabase cron, we trust the internal network
  // For external calls, you could add additional security measures

  try {
    const supabase = await createClient();
    const redis = await getRedisClient();

    // Get all active platform credentials that use OAuth
    const { data: credentials, error } = await supabase
      .from("platform_credentials")
      .select("*")
      .in("platform", ["google", "facebook", "kakao"])
      .eq("is_active", true);

    if (error) {
      throw error;
    }

    const refreshResults = [];

    for (const credential of credentials || []) {
      try {
        const tokenKey = `oauth:${credential.platform}:${credential.user_id}:${credential.account_id}:tokens`;
        const tokenData = await redis.get(tokenKey);

        if (!tokenData) {
          log.warn(
            `No token data found for ${credential.platform}:${credential.user_id}`,
          );
          continue;
        }

        const tokens = JSON.parse(tokenData);
        const now = Date.now();
        const refreshBuffer = 30 * 60 * 1000; // 30 minutes before expiry

        // Check if token needs refresh
        if (tokens.expires_at && tokens.expires_at - now < refreshBuffer) {
          // Get OAuth config with team's stored credentials
          const oauthConfig = await getOAuthConfigWithCredentials(
            credential.platform,
            credential.team_id,
          );

          if (!oauthConfig || !tokens.refresh_token) {
            log.warn(
              `Cannot refresh token for ${credential.platform}: missing config or refresh token`,
            );
            continue;
          }

          const oauthManager = new OAuthManager(
            credential.platform,
            oauthConfig,
          );

          try {
            // Refresh the token
            const newTokenData = await oauthManager.refreshAccessToken(
              tokens.refresh_token,
            );

            // Store updated tokens
            await oauthManager.storeTokens(
              credential.user_id,
              credential.account_id,
              {
                ...newTokenData,
                refresh_token:
                  newTokenData.refresh_token || tokens.refresh_token,
              },
            );

            refreshResults.push({
              platform: credential.platform,
              accountId: credential.account_id,
              status: "refreshed",
            });

            log.info(
              `Successfully refreshed token for ${credential.platform}:${credential.account_id}`,
            );
          } catch (error) {
            log.error(
              `Failed to refresh token for ${credential.platform}:${credential.account_id}:`,
              error,
            );

            // Mark credential as inactive if refresh fails
            await supabase
              .from("platform_credentials")
              .update({
                is_active: false,
                data: {
                  ...credential.data,
                  refresh_error:
                    error instanceof Error ? error.message : "Unknown error",
                  refresh_failed_at: new Date().toISOString(),
                },
              })
              .eq("id", credential.id);

            refreshResults.push({
              platform: credential.platform,
              accountId: credential.account_id,
              status: "failed",
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        } else {
          refreshResults.push({
            platform: credential.platform,
            accountId: credential.account_id,
            status: "not_needed",
          });
        }
      } catch (error) {
        log.error(
          `Error processing credential ${credential.id}:`,
          error as Error,
        );
      }
    }

    return NextResponse.json({
      success: true,
      processed: credentials?.length || 0,
      results: refreshResults,
    });
  } catch (error) {
    log.error("Token refresh cron job failed:", error as Error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
