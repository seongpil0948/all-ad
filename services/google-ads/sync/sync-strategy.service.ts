import { GoogleAdsClient } from "../core/google-ads-client";
import { CampaignControlService } from "../campaign/campaign-control.service";

import { createClient } from "@/utils/supabase/server";
import log from "@/utils/logger";
import { SyncResult, SyncError } from "@/types/google-ads.types";

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
    // For now, directly perform sync without queue
    // TODO: Implement proper queue system later
    log.info("동기화 작업 시작 (직접 실행)", { accountId, syncType });

    try {
      if (syncType === "INCREMENTAL") {
        await this.performIncrementalSync(accountId);
      } else {
        await this.performFullSync(accountId);
      }
    } catch (error) {
      log.error("동기화 작업 실패", error as Error, {
        accountId,
        syncType,
      });
      throw error;
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
