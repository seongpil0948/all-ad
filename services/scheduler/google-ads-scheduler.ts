import * as cron from "node-cron";

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
}

export class GoogleAdsScheduler {
  private syncJobs: Map<string, cron.ScheduledTask> = new Map();

  // 스케줄러 시작
  async startScheduledSync(): Promise<void> {
    log.info("Google Ads 스케줄러 시작");

    // 매시간 정각에 증분 동기화 실행
    const incrementalJob = cron.schedule("0 * * * *", async () => {
      log.info("Google Ads 증분 동기화 시작");
      await this.runScheduledSync("INCREMENTAL");
    });

    // 매일 새벽 2시에 전체 동기화 실행
    const fullSyncJob = cron.schedule("0 2 * * *", async () => {
      log.info("Google Ads 전체 동기화 시작");
      await this.runScheduledSync("FULL");
    });

    // 작업 시작
    incrementalJob.start();
    fullSyncJob.start();

    // 작업 저장
    this.syncJobs.set("incremental", incrementalJob);
    this.syncJobs.set("full", fullSyncJob);

    log.info("Google Ads 스케줄러 작업 등록 완료");
  }

  // 스케줄러 중지
  stopScheduledSync(): void {
    log.info("Google Ads 스케줄러 중지");

    for (const [jobName, job] of Array.from(this.syncJobs.entries())) {
      job.stop();
      log.info(`스케줄 작업 중지: ${jobName}`);
    }

    this.syncJobs.clear();
  }

  // 스케줄된 동기화 실행
  private async runScheduledSync(
    syncType: "FULL" | "INCREMENTAL",
  ): Promise<void> {
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

          const googleAdsClient = new GoogleAdsClient({
            clientId: credentials.clientId,
            clientSecret: credentials.clientSecret,
            refreshToken: credentials.refreshToken,
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

  // 스케줄러 상태 조회
  getSchedulerStatus(): {
    isRunning: boolean;
    jobs: { name: string; nextRun: Date | null }[];
  } {
    const jobs = Array.from(this.syncJobs.entries()).map(([name, _job]) => ({
      name,
      nextRun: null, // node-cron doesn't provide next run time easily
    }));

    return {
      isRunning: this.syncJobs.size > 0,
      jobs,
    };
  }
}
