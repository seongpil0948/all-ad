import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import { GoogleAdsSyncService } from "@/services/google-ads/sync/sync-strategy.service";
import { GoogleAdsClient } from "@/services/google-ads/core/google-ads-client";
import log from "@/utils/logger";

// This endpoint is called by Vercel cron
export async function GET(request: NextRequest) {
  // Verify the request is from a trusted source
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    // Get all active Google Ads accounts
    const { data: accounts, error } = await supabase
      .from("platform_credentials")
      .select("*")
      .eq("platform", "google")
      .eq("is_active", true);

    if (error) {
      throw error;
    }

    const syncResults = [];

    for (const account of accounts || []) {
      try {
        // Skip if no credentials
        if (
          !account.credentials?.client_id ||
          !account.credentials?.client_secret
        ) {
          log.warn(
            `Skipping Google Ads account without credentials: ${account.id}`,
          );
          continue;
        }

        // Skip if no refresh token
        if (!account.credentials?.refresh_token) {
          log.warn(
            `Skipping Google Ads account without refresh token: ${account.id}`,
          );
          continue;
        }

        // Get valid access token using OAuth Manager
        const { OAuthManager } = await import("@/lib/oauth/oauth-manager");
        const { getOAuthConfigWithCredentials } = await import(
          "@/lib/oauth/platform-configs"
        );

        const oauthConfig = await getOAuthConfigWithCredentials(
          "google",
          account.team_id,
        );

        if (!oauthConfig) {
          log.warn(
            `Skipping Google Ads account without OAuth config: ${account.id}`,
          );
          continue;
        }

        const oauthManager = new OAuthManager("google", oauthConfig);
        const accessToken = await oauthManager.getValidAccessToken(
          account.user_id,
          account.account_id,
        );

        if (!accessToken) {
          log.warn(
            `Failed to get access token for Google Ads account: ${account.id}`,
          );
          continue;
        }

        const googleAdsClient = new GoogleAdsClient({
          clientId: account.credentials.client_id,
          clientSecret: account.credentials.client_secret,
          refreshToken: account.credentials.refresh_token,
          accessToken: accessToken,
          developerToken:
            account.credentials.developer_token ||
            process.env.GOOGLE_ADS_DEVELOPER_TOKEN ||
            "",
          loginCustomerId: account.credentials.login_customer_id,
        });

        const syncService = new GoogleAdsSyncService(googleAdsClient);

        // Determine sync type based on last sync time
        const lastSync = account.last_synced_at
          ? new Date(account.last_synced_at)
          : null;
        const hoursSinceLastSync = lastSync
          ? (Date.now() - lastSync.getTime()) / (1000 * 60 * 60)
          : 24;

        const syncType = hoursSinceLastSync > 12 ? "FULL" : "INCREMENTAL";

        await syncService.scheduleSyncForAccount(
          account.customer_id || account.account_id,
          syncType,
        );

        // Update last sync time
        await supabase
          .from("platform_credentials")
          .update({
            last_synced_at: new Date().toISOString(),
          })
          .eq("id", account.id);

        syncResults.push({
          accountId: account.account_id,
          accountName: account.account_name,
          syncType,
          status: "scheduled",
        });

        log.info(`Google Ads sync scheduled for ${account.account_name}`, {
          accountId: account.account_id,
          syncType,
        });
      } catch (error) {
        log.error(
          `Failed to schedule sync for Google Ads account ${account.id}:`,
          error,
        );

        syncResults.push({
          accountId: account.account_id,
          accountName: account.account_name,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: accounts?.length || 0,
      results: syncResults,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    log.error("Google Ads sync cron job failed:", error as Error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
