import { GoogleAdsClient } from "../core/google-ads-client";
import { CampaignControlService } from "../campaign/campaign-control.service";

import { createClient } from "@/utils/supabase/server";
import log from "@/utils/logger";
import { SyncResult, SyncError } from "@/types/google-ads.types";

// Queue system types
type SyncJobStatus = "pending" | "processing" | "completed" | "failed";

interface SyncJob {
  id: string;
  accountId: string;
  syncType: "FULL" | "INCREMENTAL";
  status: SyncJobStatus;
  createdAt: Date;
  retryCount: number;
}

// Type definitions
interface GoogleAdsCampaignData {
  id?: string;
  name?: string;
  status?: string;
  budgetAmountMicros?: string;
  startDate?: string;
  endDate?: string;
  "campaign.id"?: string;
  "campaign.name"?: string;
  "campaign.status"?: string;
  "campaign_budget.amount_micros"?: string;
  "campaign.start_date"?: string;
  "campaign.end_date"?: string;
  metrics?: {
    impressions?: string;
    clicks?: string;
    costMicros?: string;
    conversions?: string;
    conversionValue?: string;
  };
  "metrics.impressions"?: string;
  "metrics.clicks"?: string;
  "metrics.cost_micros"?: string;
  "metrics.conversions"?: string;
  "metrics.conversions_value"?: string;
  "metrics.ctr"?: string;
  "metrics.average_cpc"?: string;
  "metrics.average_cpm"?: string;
}

interface SyncLog {
  id: string;
  team_id: string;
  platform: string;
  last_sync_at: string;
  sync_type: "FULL" | "INCREMENTAL";
  records_processed: number;
  success_count: number;
  error_count: number;
  status: string;
  created_at: string;
  completed_at?: string;
}

export class GoogleAdsSyncService {
  private googleAdsClient: GoogleAdsClient;
  private campaignService: CampaignControlService;

  constructor(googleAdsClient: GoogleAdsClient) {
    this.googleAdsClient = googleAdsClient;
    this.campaignService = new CampaignControlService(googleAdsClient);
  }

  // 계정별 동기화 작업 스케줄링
  async scheduleSyncForAccount(
    accountId: string,
    syncType: "FULL" | "INCREMENTAL",
  ): Promise<void> {
    // Implement proper queue system using Redis or in-memory queue
    const jobId = this.generateJobId();
    const job = {
      id: jobId,
      accountId,
      syncType,
      status: "pending" as const,
      createdAt: new Date(),
      retryCount: 0,
    };

    log.info("동기화 작업 큐에 추가", { jobId, accountId, syncType });

    try {
      // Add job to queue
      await this.addJobToQueue(job);

      // Process the job (in a real implementation, this would be handled by a worker)
      await this.processJob(job);
    } catch (error) {
      log.error("동기화 작업 큐 처리 실패", error as Error, {
        jobId,
        accountId,
        syncType,
      });
      throw error;
    }
  }

  private generateJobId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private async addJobToQueue(job: SyncJob): Promise<void> {
    try {
      // Try to use Redis for queue management
      const { createClient } = await import("redis");
      const redis = createClient({ url: process.env.REDIS_URL });

      await redis.connect();

      // Add job to Redis queue
      await redis.lPush("google_ads_sync_queue", JSON.stringify(job));

      // Set job status in Redis
      await redis.hSet(`job:${job.id}`, {
        id: job.id,
        accountId: job.accountId,
        syncType: job.syncType,
        status: job.status,
        createdAt: job.createdAt.toISOString(),
        retryCount: job.retryCount.toString(),
      });

      await redis.quit();

      log.info("동기화 작업이 Redis 큐에 추가됨", { jobId: job.id });
    } catch (redisError) {
      log.warn("Redis 큐 사용 실패, 메모리 큐로 대체", {
        error:
          redisError instanceof Error ? redisError.message : "Unknown error",
      });

      // Fallback to in-memory queue
      this.inMemoryQueue.push(job);
    }
  }

  private async processJob(job: SyncJob): Promise<void> {
    try {
      await this.updateJobStatus(job.id, "processing");

      log.info("동기화 작업 처리 시작", {
        jobId: job.id,
        accountId: job.accountId,
      });

      if (job.syncType === "INCREMENTAL") {
        await this.performIncrementalSync(job.accountId);
      } else {
        await this.performFullSync(job.accountId);
      }

      await this.updateJobStatus(job.id, "completed");

      log.info("동기화 작업 완료", { jobId: job.id, accountId: job.accountId });
    } catch (error) {
      await this.updateJobStatus(job.id, "failed");

      log.error("동기화 작업 처리 실패", error as Error, {
        jobId: job.id,
        accountId: job.accountId,
      });

      // Implement retry logic
      if (job.retryCount < 3) {
        job.retryCount++;
        job.status = "pending";
        await this.addJobToQueue(job);

        log.info("동기화 작업 재시도 큐에 추가", {
          jobId: job.id,
          retryCount: job.retryCount,
        });
      } else {
        log.error("동기화 작업 최대 재시도 횟수 초과", {
          jobId: job.id,
          accountId: job.accountId,
        });
      }

      throw error;
    }
  }

  private async updateJobStatus(
    jobId: string,
    status: SyncJobStatus,
  ): Promise<void> {
    try {
      const { createClient } = await import("redis");
      const redis = createClient({ url: process.env.REDIS_URL });

      await redis.connect();

      await redis.hSet(`job:${jobId}`, "status", status);
      await redis.quit();
    } catch {
      // Update in-memory queue if Redis is not available
      const job = this.inMemoryQueue.find((j) => j.id === jobId);

      if (job) {
        job.status = status;
      }
    }
  }

  // In-memory queue as fallback
  private inMemoryQueue: SyncJob[] = [];

  // Method to get job status
  async getJobStatus(jobId: string): Promise<SyncJob | null> {
    try {
      const { createClient } = await import("redis");
      const redis = createClient({ url: process.env.REDIS_URL });

      await redis.connect();

      const jobData = await redis.hGetAll(`job:${jobId}`);

      await redis.quit();

      if (Object.keys(jobData).length === 0) {
        return null;
      }

      return {
        id: jobData.id,
        accountId: jobData.accountId,
        syncType: jobData.syncType as "FULL" | "INCREMENTAL",
        status: jobData.status as SyncJobStatus,
        createdAt: new Date(jobData.createdAt),
        retryCount: parseInt(jobData.retryCount, 10),
      };
    } catch {
      // Check in-memory queue
      return this.inMemoryQueue.find((job) => job.id === jobId) || null;
    }
  }

  // 증분 동기화 수행
  private async performIncrementalSync(accountId: string): Promise<SyncResult> {
    const supabase = await createClient();
    const errors: SyncError[] = [];
    let recordsProcessed = 0;
    let successCount = 0;
    const startTime = new Date();

    try {
      // 마지막 동기화 시점 조회
      const { data: lastSync } = await supabase
        .from("sync_logs")
        .select("last_sync_at")
        .eq("account_id", accountId)
        .eq("platform", "google_ads")
        .single();

      const lastSyncDate =
        lastSync?.last_sync_at ||
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      // 변경된 캠페인 데이터 조회
      const modifiedCampaigns = await this.getModifiedCampaigns(
        accountId,
        lastSyncDate,
      );

      recordsProcessed = modifiedCampaigns.length;

      // 데이터베이스 업데이트
      for (const campaign of modifiedCampaigns) {
        try {
          await this.updateCampaignData(accountId, campaign);
          successCount++;
        } catch (error) {
          errors.push({
            accountId: accountId,
            error: (error as Error).message,
            timestamp: new Date(),
          });
        }
      }

      // 동기화 로그 업데이트
      await supabase.from("sync_logs").insert({
        team_id: accountId, // Assuming accountId is team_id in this context
        platform: "google",
        last_sync_at: new Date().toISOString(),
        sync_type: "INCREMENTAL",
        records_processed: recordsProcessed,
        success_count: successCount,
        error_count: errors.length,
        status: "completed",
        completed_at: new Date().toISOString(),
      });

      const result: SyncResult = {
        accountId,
        success: errors.length === 0,
        recordsProcessed,
        errors: errors,
        startTime: startTime,
        endTime: new Date(),
      };

      log.info("증분 동기화 완료", { ...result });

      return result;
    } catch (error) {
      log.error("증분 동기화 실패", error as Error, { accountId });
      throw error;
    }
  }

  // 전체 동기화 수행
  private async performFullSync(accountId: string): Promise<SyncResult> {
    const supabase = await createClient();
    const errors: SyncError[] = [];
    let recordsProcessed = 0;
    let successCount = 0;
    const startTime = new Date();

    try {
      // 모든 캠페인 조회
      const campaigns = await this.campaignService.getCampaigns(accountId);

      recordsProcessed = campaigns.length;

      // 데이터베이스 업데이트
      for (const campaign of campaigns) {
        try {
          // Convert GoogleAdsCampaign to GoogleAdsCampaignData format
          const campaignData: GoogleAdsCampaignData = {
            "campaign.id": campaign.id,
            "campaign.name": campaign.name,
            "campaign.status": campaign.status,
            "campaign_budget.amount_micros":
              campaign.budgetAmountMicros?.toString(),
            "metrics.impressions": campaign.impressions?.toString(),
            "metrics.clicks": campaign.clicks?.toString(),
            "metrics.cost_micros": campaign.costMicros?.toString(),
          };

          await this.updateCampaignData(accountId, campaignData);
          successCount++;
        } catch (error) {
          errors.push({
            accountId: accountId,
            error: (error as Error).message,
            timestamp: new Date(),
          });
        }
      }

      // 동기화 로그 업데이트
      await supabase.from("sync_logs").insert({
        team_id: accountId, // Assuming accountId is team_id in this context
        platform: "google",
        last_sync_at: new Date().toISOString(),
        sync_type: "FULL",
        records_processed: recordsProcessed,
        success_count: successCount,
        error_count: errors.length,
        status: "completed",
        completed_at: new Date().toISOString(),
      });

      const result: SyncResult = {
        accountId,
        success: errors.length === 0,
        recordsProcessed,
        errors: errors,
        startTime: startTime,
        endTime: new Date(),
      };

      log.info("전체 동기화 완료", { ...result });

      return result;
    } catch (error) {
      log.error("전체 동기화 실패", error as Error, { accountId });
      throw error;
    }
  }

  // 변경된 캠페인 조회
  private async getModifiedCampaigns(
    accountId: string,
    since: string,
  ): Promise<GoogleAdsCampaignData[]> {
    const sinceDate = since.split("T")[0];
    const query = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign_budget.amount_micros,
        campaign.start_date,
        campaign.end_date,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.ctr,
        metrics.average_cpc,
        metrics.average_cpm,
        segments.date
      FROM campaign
      WHERE segments.date >= '${sinceDate}'
        AND campaign.status != 'REMOVED'
      ORDER BY segments.date DESC
    `;

    try {
      const results = await this.googleAdsClient.query<GoogleAdsCampaignData>(
        accountId,
        query,
      );

      return results;
    } catch (error) {
      log.error("변경된 캠페인 조회 실패", error as Error, {
        accountId,
        since,
      });
      throw error;
    }
  }

  // 캠페인 데이터 업데이트
  private async updateCampaignData(
    accountId: string,
    campaignData: GoogleAdsCampaignData,
  ): Promise<void> {
    const supabase = await createClient();

    try {
      // campaigns 테이블 업데이트
      const { error } = await supabase.from("campaigns").upsert({
        account_id: accountId,
        platform: "google_ads",
        campaign_id: campaignData.id || campaignData["campaign.id"],
        name: campaignData.name || campaignData["campaign.name"],
        status: campaignData.status || campaignData["campaign.status"],
        budget: parseInt(
          campaignData.budgetAmountMicros ||
            campaignData["campaign_budget.amount_micros"] ||
            "0",
        ),
        start_date:
          campaignData.startDate || campaignData["campaign.start_date"],
        end_date: campaignData.endDate || campaignData["campaign.end_date"],
        impressions: parseInt(
          campaignData.metrics?.impressions ||
            campaignData["metrics.impressions"] ||
            "0",
        ),
        clicks: parseInt(
          campaignData.metrics?.clicks || campaignData["metrics.clicks"] || "0",
        ),
        cost: parseInt(
          campaignData.metrics?.costMicros ||
            campaignData["metrics.cost_micros"] ||
            "0",
        ),
        conversions: parseFloat(
          campaignData.metrics?.conversions ||
            campaignData["metrics.conversions"] ||
            "0",
        ),
        conversion_value: parseFloat(
          campaignData.metrics?.conversionValue ||
            campaignData["metrics.conversions_value"] ||
            "0",
        ),
        updated_at: new Date().toISOString(),
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      log.error("캠페인 데이터 업데이트 실패", error as Error, {
        accountId,
        campaignId: campaignData.id,
      });
      throw error;
    }
  }

  // 동기화 상태 조회
  async getSyncStatus(accountId: string): Promise<SyncLog | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("sync_logs")
      .select("*")
      .eq("account_id", accountId)
      .eq("platform", "google_ads")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return data;
  }

  // 동기화 이력 조회
  async getSyncHistory(
    accountId: string,
    limit: number = 10,
  ): Promise<SyncLog[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("sync_logs")
      .select("*")
      .eq("account_id", accountId)
      .eq("platform", "google_ads")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data || [];
  }
}
