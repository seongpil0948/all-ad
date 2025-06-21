import type { Campaign, CampaignMetrics, PlatformType } from "@/types";
import type { GoogleAdsCredentials } from "@/types/credentials.types";

import { PlatformService } from "./platform-service.interface";

import { GoogleAdsClient } from "@/services/google-ads/core/google-ads-client";
import { CampaignControlService } from "@/services/google-ads/campaign/campaign-control.service";
import log from "@/utils/logger";

export class GoogleAdsPlatformService implements PlatformService {
  platform: PlatformType = "google";
  private credentials: GoogleAdsCredentials | null = null;
  private googleAdsClient: GoogleAdsClient | null = null;
  private campaignService: CampaignControlService | null = null;

  setCredentials(credentials: Record<string, unknown>): void {
    this.credentials = credentials as unknown as GoogleAdsCredentials;

    // customerId가 없으면 platform_credentials 테이블의 settings에서 가져오기
    if (!this.credentials.customerId && credentials.settings) {
      const settings = credentials.settings as Record<string, unknown>;

      this.credentials.customerId = settings.customerId as string;
    }

    if (!this.credentials.customerId) {
      throw new Error("Customer ID is required for Google Ads");
    }

    // Google Ads 클라이언트 초기화
    this.googleAdsClient = new GoogleAdsClient({
      clientId: this.credentials.clientId,
      clientSecret: this.credentials.clientSecret,
      developerToken: this.credentials.developerToken,
      refreshToken: this.credentials.refreshToken,
      loginCustomerId: this.credentials.loginCustomerId,
    });

    this.campaignService = new CampaignControlService(this.googleAdsClient);
  }

  async validateCredentials(): Promise<boolean> {
    if (!this.credentials || !this.googleAdsClient) {
      return false;
    }

    try {
      // 계정 정보 조회로 자격 증명 검증
      const accountInfo = await this.googleAdsClient.getAccountInfo(
        this.credentials.customerId,
      );

      return !!accountInfo;
    } catch (error) {
      log.error("Google Ads credentials validation failed", error as Error);

      return false;
    }
  }

  async fetchCampaigns(): Promise<Campaign[]> {
    if (!this.campaignService || !this.credentials) {
      throw new Error("Google Ads service not initialized");
    }

    try {
      const googleCampaigns = await this.campaignService.getCampaigns(
        this.credentials.customerId,
        false, // includeRemoved = false
      );

      // Google Ads 캠페인을 공통 Campaign 타입으로 변환
      return googleCampaigns.map((campaign) => ({
        id: campaign.id,
        teamId: this.credentials!.customerId, // Use customer ID as team ID for now
        platformCampaignId: campaign.id,
        name: campaign.name,
        platform: "google" as PlatformType,
        status: campaign.status === "ENABLED" ? "active" : "paused",
        isActive: campaign.status === "ENABLED",
        budget: campaign.budgetAmountMicros / 1000000, // micros to currency
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // 메트릭 데이터 포함
        metrics: campaign.metrics
          ? {
              impressions: campaign.metrics.impressions,
              clicks: campaign.metrics.clicks,
              cost: campaign.metrics.costMicros / 1000000,
              conversions: campaign.metrics.conversions,
              ctr: campaign.metrics.ctr,
              cpc: campaign.metrics.averageCpc / 1000000,
              cpm: campaign.metrics.averageCpm / 1000,
            }
          : undefined,
      }));
    } catch (error) {
      log.error("Failed to fetch Google Ads campaigns", error as Error);
      throw error;
    }
  }

  async fetchCampaignMetrics(
    campaignId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CampaignMetrics[]> {
    if (!this.campaignService || !this.credentials) {
      throw new Error("Google Ads service not initialized");
    }

    try {
      const metrics = await this.campaignService.getCampaignMetrics(
        this.credentials.customerId,
        campaignId,
        this.formatDate(startDate),
        this.formatDate(endDate),
      );

      // Google Ads 메트릭을 공통 CampaignMetrics 타입으로 변환
      return metrics.map((metric) => ({
        campaignId,
        date: metric.date || new Date().toISOString(),
        impressions: metric.impressions,
        clicks: metric.clicks,
        cost: metric.costMicros / 1000000,
        conversions: metric.conversions,
        revenue: metric.conversionValue,
        ctr: metric.ctr,
        cpc: metric.averageCpc / 1000000,
        cpm: metric.averageCpm / 1000,
        roas:
          metric.conversionValue > 0
            ? metric.conversionValue / (metric.costMicros / 1000000)
            : 0,
      }));
    } catch (error) {
      log.error("Failed to fetch Google Ads campaign metrics", error as Error);
      throw error;
    }
  }

  async updateCampaignBudget(
    campaignId: string,
    budget: number,
  ): Promise<boolean> {
    if (!this.campaignService || !this.credentials) {
      throw new Error("Google Ads service not initialized");
    }

    try {
      const budgetMicros = Math.round(budget * 1000000);

      await this.campaignService.updateCampaignBudget(
        this.credentials.customerId,
        campaignId,
        budgetMicros,
      );

      return true;
    } catch (error) {
      log.error("Failed to update Google Ads campaign budget", error as Error);

      return false;
    }
  }

  async updateCampaignStatus(
    campaignId: string,
    isActive: boolean,
  ): Promise<boolean> {
    if (!this.campaignService || !this.credentials) {
      throw new Error("Google Ads service not initialized");
    }

    try {
      const status = isActive ? "ENABLED" : "PAUSED";

      await this.campaignService.updateCampaignStatus(
        this.credentials.customerId,
        [{ campaignId, status }],
      );

      return true;
    } catch (error) {
      log.error("Failed to update Google Ads campaign status", error as Error);

      return false;
    }
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }
}
