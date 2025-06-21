import { GoogleAdsSyncService } from "../google-ads/sync/sync-strategy.service";
import { GoogleAdsClient } from "../google-ads/core/google-ads-client";

import { createClient } from "@/utils/supabase/server";
import { GoogleAdsCredentials } from "@/types";
import log from "@/utils/logger";

// Type definitions
interface GoogleAdsAccountRecord {
  id: string;
  team_id: string;
  platform: string;
  account_id: string;
  account_name: string;
  credentials: {
    client_id: string;
    client_secret: string;
    refresh_token: string;
    developer_token: string;
    login_customer_id?: string;
  };
  is_active: boolean;
  customer_id: string;
  user_id?: string;
  created_by?: string;
}

export class GoogleAdsScheduler {
  // Vercel Cron을 사용하므로 node-cron 관련 코드 제거
  // 스케줄링은 vercel.json에서 설정하고,
  // /api/cron/google-ads-sync endpoint에서 처리

  // 스케줄된 동기화 실행 (Vercel Cron에서 호출)
  async runScheduledSync(syncType: "FULL" | "INCREMENTAL"): Promise<void> {
    try {
      const accounts = await this.getActiveGoogleAdsAccounts();

      log.info(`${syncType} 동기화 대상 계정 수: ${accounts.length}`);

      for (const account of accounts) {
        try {
          const credentials = {
            clientId: account.credentials.client_id,
            clientSecret: account.credentials.client_secret,
            refreshToken: account.credentials.refresh_token,
            developerToken: account.credentials.developer_token,
            customerId: account.customer_id,
            loginCustomerId: account.credentials.login_customer_id,
          } as GoogleAdsCredentials;

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
          const userId = account.user_id || account.created_by;

          if (!userId) {
            log.warn(
              `Skipping Google Ads account without user_id: ${account.id}`,
            );
            continue;
          }

          const accessToken = await oauthManager.getValidAccessToken(
            userId,
            account.account_id,
          );

          if (!accessToken) {
            log.warn(
              `Failed to get access token for Google Ads account: ${account.id}`,
            );
            continue;
          }

          const googleAdsClient = new GoogleAdsClient({
            clientId: credentials.clientId,
            clientSecret: credentials.clientSecret,
            refreshToken: credentials.refreshToken,
            accessToken: accessToken,
            developerToken: credentials.developerToken,
            loginCustomerId: credentials.loginCustomerId,
          });
          const syncService = new GoogleAdsSyncService(googleAdsClient);

          await syncService.scheduleSyncForAccount(
            account.customer_id,
            syncType,
          );

          log.info(`동기화 스케줄링 완료: ${account.account_name}`, {
            accountId: account.customer_id,
            syncType,
          });
        } catch (error) {
          log.error(
            `계정 동기화 스케줄링 실패: ${account.account_name}`,
            error as Error,
            {
              accountId: account.customer_id,
              syncType,
            },
          );
        }
      }
    } catch (error) {
      log.error("스케줄된 동기화 실행 실패", error as Error, { syncType });
    }
  }

  // 활성화된 Google Ads 계정 목록 조회
  private async getActiveGoogleAdsAccounts(): Promise<
    GoogleAdsAccountRecord[]
  > {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("platform_credentials")
      .select(
        `
        id,
        team_id,
        platform,
        account_id,
        account_name,
        credentials,
        is_active,
        customer_id
      `,
      )
      .eq("platform", "google")
      .eq("is_active", true);

    if (error) {
      log.error("Google Ads 계정 조회 실패", error);
      throw error;
    }

    return data || [];
  }

  // 특정 계정의 동기화 즉시 실행
  async triggerManualSync(
    accountId: string,
    syncType: "FULL" | "INCREMENTAL",
  ): Promise<void> {
    log.info("수동 동기화 트리거", { accountId, syncType });

    const supabase = await createClient();

    // 계정 정보 조회
    const { data: account, error } = await supabase
      .from("platform_credentials")
      .select("*")
      .eq("customer_id", accountId)
      .eq("platform", "google")
      .single();

    if (error || !account) {
      throw new Error(`계정을 찾을 수 없습니다: ${accountId}`);
    }

    const credentials = {
      clientId: account.credentials.client_id,
      clientSecret: account.credentials.client_secret,
      refreshToken: account.credentials.refresh_token,
      developerToken: account.credentials.developer_token,
      customerId: account.customer_id,
      loginCustomerId: account.credentials.login_customer_id,
    } as GoogleAdsCredentials;

    const googleAdsClient = new GoogleAdsClient({
      clientId: credentials.clientId,
      clientSecret: credentials.clientSecret,
      refreshToken: credentials.refreshToken,
      developerToken: credentials.developerToken,
      loginCustomerId: credentials.loginCustomerId,
    });
    const syncService = new GoogleAdsSyncService(googleAdsClient);

    await syncService.scheduleSyncForAccount(accountId, syncType);
  }

  // 스케줄러 상태 조회 (Vercel Cron 사용)
  getSchedulerStatus(): {
    isRunning: boolean;
    cronJobs: { path: string; schedule: string }[];
  } {
    // Vercel Cron 설정 정보 반환
    return {
      isRunning: true, // Vercel Cron은 항상 활성화
      cronJobs: [
        {
          path: "/api/cron/google-ads-sync",
          schedule: "0 * * * *", // 매시간
        },
        {
          path: "/api/cron/refresh-tokens",
          schedule: "0 * * * *", // 매시간
        },
      ],
    };
  }
}
