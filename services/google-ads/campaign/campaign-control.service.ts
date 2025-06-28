import type { MutateOperation } from "google-ads-api";

import { GoogleAdsClient } from "../core/google-ads-client";

import log from "@/utils/logger";
import {
  CampaignStatusUpdate,
  GoogleAdsCampaign,
  GoogleAdsMetrics,
} from "@/types/google-ads.types";

// Type definitions for Google Ads API responses
interface GoogleAdsMutateResponse {
  results: Array<{
    resource_name: string;
  }>;
  partial_failure_error?: unknown;
}

interface GoogleAdsCampaignResult {
  "campaign.id": string;
  "campaign.name": string;
  "campaign.status": string;
  "campaign_budget.amount_micros": string;
  "campaign.start_date": string;
  "campaign.end_date": string;
  "campaign.campaign_budget": string;
  "campaign.type"?: string;
  "metrics.impressions"?: string;
  "metrics.clicks"?: string;
  "metrics.cost_micros"?: string;
  "metrics.conversions"?: string;
  "metrics.conversions_value"?: string;
  "metrics.ctr"?: string;
  "metrics.average_cpc"?: string;
  "metrics.average_cpm"?: string;
  "segments.date"?: string;
}

export class CampaignControlService {
  constructor(private googleAdsClient: GoogleAdsClient) {}

  // 캠페인 상태 업데이트 (ON/OFF)
  async updateCampaignStatus(
    customerId: string,
    updates: CampaignStatusUpdate[],
  ): Promise<GoogleAdsMutateResponse> {
    try {
      // google-ads-api 라이브러리의 정확한 형식으로 operations 생성
      const operations = updates.map((update) => {
        // Resource enum 대신 string 사용
        return {
          entity: "campaign",
          operation: "update" as const,
          resource: {
            resource_name: `customers/${customerId}/campaigns/${update.campaignId}`,
            status: update.status,
          },
          update_mask: {
            paths: ["status"],
          },
        };
      });

      log.info("캠페인 상태 업데이트 시도", {
        customerId,
        count: updates.length,
        operations: JSON.stringify(operations),
      });

      const response = await this.googleAdsClient.mutate(
        customerId,
        operations as MutateOperation<Record<string, unknown>>[],
      );

      log.info("캠페인 상태 업데이트 성공", {
        customerId,
        count: updates.length,
      });

      return response;
    } catch (error) {
      const err = error as {
        message?: string;
        code?: string;
        details?: unknown;
        errors?: unknown;
      };

      log.error("캠페인 상태 업데이트 실패", {
        customerId,
        updates,
        error: {
          message: err?.message,
          code: err?.code,
          details: err?.details,
          errors: err?.errors,
        },
      });
      throw error;
    }
  }

  // 캠페인 목록 조회
  async getCampaigns(
    customerId: string,
    includeRemoved = false,
  ): Promise<GoogleAdsCampaign[]> {
    const query = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign_budget.amount_micros,
        campaign.start_date,
        campaign.end_date,
        campaign.campaign_budget,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.ctr,
        metrics.average_cpc,
        metrics.average_cpm
      FROM campaign
      WHERE segments.date DURING LAST_30_DAYS
      ${!includeRemoved ? 'AND campaign.status != "REMOVED"' : ""}
      ORDER BY campaign.id
    `;

    try {
      const results = await this.googleAdsClient.query<GoogleAdsCampaignResult>(
        customerId,
        query,
      );

      // 결과를 GoogleAdsCampaign 형식으로 변환
      return results.map((result) => ({
        id: result["campaign.id"],
        name: result["campaign.name"],
        status: result["campaign.status"] as "ENABLED" | "PAUSED" | "REMOVED",
        budgetAmountMicros: parseInt(
          result["campaign_budget.amount_micros"] || "0",
        ),
        type: result["campaign.type"] || "",
        startDate: result["campaign.start_date"],
        endDate: result["campaign.end_date"],
        metrics: {
          impressions: parseInt(result["metrics.impressions"] || "0"),
          clicks: parseInt(result["metrics.clicks"] || "0"),
          costMicros: parseInt(result["metrics.cost_micros"] || "0"),
          conversions: parseFloat(result["metrics.conversions"] || "0"),
          conversionValue: parseFloat(
            result["metrics.conversions_value"] || "0",
          ),
          ctr: parseFloat(result["metrics.ctr"] || "0"),
          averageCpc: parseFloat(result["metrics.average_cpc"] || "0"),
          averageCpm: parseFloat(result["metrics.average_cpm"] || "0"),
        } as GoogleAdsMetrics,
      }));
    } catch (error) {
      log.error("캠페인 조회 실패", error as Error, { customerId });
      throw error;
    }
  }

  // 단일 캠페인 상태 변경 (편의 메서드)
  async toggleCampaignStatus(
    customerId: string,
    campaignId: string,
    enable: boolean,
  ): Promise<GoogleAdsMutateResponse> {
    const status = enable ? "ENABLED" : "PAUSED";

    return this.updateCampaignStatus(customerId, [{ campaignId, status }]);
  }

  // 여러 캠페인 일괄 활성화
  async enableCampaigns(
    customerId: string,
    campaignIds: string[],
  ): Promise<GoogleAdsMutateResponse> {
    const updates: CampaignStatusUpdate[] = campaignIds.map((campaignId) => ({
      campaignId,
      status: "ENABLED",
    }));

    return this.updateCampaignStatus(customerId, updates);
  }

  // 여러 캠페인 일괄 비활성화
  async pauseCampaigns(
    customerId: string,
    campaignIds: string[],
  ): Promise<GoogleAdsMutateResponse> {
    const updates: CampaignStatusUpdate[] = campaignIds.map((campaignId) => ({
      campaignId,
      status: "PAUSED",
    }));

    return this.updateCampaignStatus(customerId, updates);
  }

  // 캠페인 성과 메트릭 조회
  async getCampaignMetrics(
    customerId: string,
    campaignId: string,
    startDate: string,
    endDate: string,
  ): Promise<GoogleAdsMetrics[]> {
    const query = `
      SELECT
        campaign.id,
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
      WHERE campaign.id = ${campaignId}
        AND segments.date BETWEEN '${startDate}' AND '${endDate}'
      ORDER BY segments.date DESC
    `;

    try {
      const results = await this.googleAdsClient.query<GoogleAdsCampaignResult>(
        customerId,
        query,
      );

      return results.map((result) => ({
        impressions: parseInt(result["metrics.impressions"] || "0"),
        clicks: parseInt(result["metrics.clicks"] || "0"),
        costMicros: parseInt(result["metrics.cost_micros"] || "0"),
        conversions: parseFloat(result["metrics.conversions"] || "0"),
        conversionValue: parseFloat(result["metrics.conversions_value"] || "0"),
        ctr: parseFloat(result["metrics.ctr"] || "0"),
        averageCpc: parseFloat(result["metrics.average_cpc"] || "0"),
        averageCpm: parseFloat(result["metrics.average_cpm"] || "0"),
        date: result["segments.date"],
      }));
    } catch (error) {
      log.error("캠페인 메트릭 조회 실패", error as Error, {
        customerId,
        campaignId,
      });
      throw error;
    }
  }

  // 캠페인 예산 업데이트
  async updateCampaignBudget(
    customerId: string,
    campaignId: string,
    budgetAmountMicros: number,
  ): Promise<GoogleAdsMutateResponse> {
    // 먼저 캠페인의 현재 예산 ID를 조회
    const campaignQuery = `
      SELECT
        campaign.id,
        campaign.campaign_budget
      FROM campaign
      WHERE campaign.id = ${campaignId}
    `;

    const campaigns = await this.googleAdsClient.query<{
      "campaign.id": string;
      "campaign.campaign_budget": string;
    }>(customerId, campaignQuery);

    if (!campaigns.length) {
      throw new Error(`캠페인을 찾을 수 없습니다: ${campaignId}`);
    }

    const budgetResourceName = campaigns[0]["campaign.campaign_budget"];

    // 예산 업데이트
    const operations = [
      {
        entity: "campaign_budget",
        operation: "update",
        resource: {
          resource_name: budgetResourceName,
          amount_micros: budgetAmountMicros.toString(),
        },
        update_mask: {
          paths: ["amount_micros"],
        },
      } as MutateOperation<Record<string, unknown>>,
    ];

    try {
      const response = await this.googleAdsClient.mutate(
        customerId,
        operations,
      );

      log.info("캠페인 예산 업데이트 성공", {
        customerId,
        campaignId,
        budgetAmountMicros,
      });

      return response;
    } catch (error) {
      log.error("캠페인 예산 업데이트 실패", error as Error, {
        customerId,
        campaignId,
      });
      throw error;
    }
  }
}
