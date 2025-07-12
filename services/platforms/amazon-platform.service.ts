import { PlatformService } from "./platform-service.interface";
import {
  AmazonAdsApiClient,
  AmazonAdsCredentials,
  AmazonCampaign,
} from "./api-clients/amazon-ads-api";

import { Campaign, PlatformCredentials } from "@/types";
import { CampaignMetrics } from "@/types/campaign.types";
import { PlatformType } from "@/types/base.types";
import log from "@/utils/logger";

export class AmazonPlatformService implements PlatformService {
  public platform: PlatformType = "amazon" as any;
  private client: AmazonAdsApiClient | null = null;
  private credentials: Record<string, unknown> = {};
  private teamId: string = "";

  async initialize(credentials: PlatformCredentials): Promise<void> {
    try {
      const amazonCredentials: AmazonAdsCredentials =
        credentials.credentials as AmazonAdsCredentials;

      // Store teamId for use in transformCampaign
      this.teamId = credentials.team_id;

      // 지역 정보를 자격 증명에서 추출하거나 기본값 사용
      const region = this.getRegionFromCountryCode(
        amazonCredentials.country_code,
      );

      this.client = new AmazonAdsApiClient(amazonCredentials, region);

      log.info("Amazon platform service initialized", {
        profileId: amazonCredentials.profile_id,
        countryCode: amazonCredentials.country_code,
        region,
        teamId: this.teamId,
      });
    } catch (error) {
      log.error("Failed to initialize Amazon platform service", { error });
      throw new Error("Amazon platform service initialization failed");
    }
  }

  private getRegionFromCountryCode(countryCode: string): string {
    const regionMap: Record<string, string> = {
      US: "NA",
      CA: "NA",
      MX: "NA",
      UK: "EU",
      DE: "EU",
      FR: "EU",
      IT: "EU",
      ES: "EU",
      NL: "EU",
      SE: "EU",
      PL: "EU",
      TR: "EU",
      JP: "FE",
      AU: "FE",
      SG: "FE",
      IN: "FE",
      AE: "FE",
      SA: "FE",
      EG: "FE",
      BR: "NA",
    };

    return regionMap[countryCode] || "NA";
  }

  async getCampaigns(): Promise<Campaign[]> {
    if (!this.client) {
      throw new Error("Amazon client not initialized");
    }

    try {
      const amazonCampaigns = await this.client.getCampaigns({
        stateFilter: "enabled,paused",
      });

      return amazonCampaigns.map((campaign) =>
        this.transformCampaign(campaign, this.teamId),
      );
    } catch (error) {
      log.error("Failed to fetch Amazon campaigns", { error });
      throw error;
    }
  }

  async createCampaign(campaignData: Partial<Campaign>): Promise<Campaign> {
    if (!this.client) {
      throw new Error("Amazon client not initialized");
    }

    try {
      const amazonCampaignData = this.transformToAmazonCampaign(campaignData);
      const createdCampaign =
        await this.client.createCampaign(amazonCampaignData);

      return this.transformCampaign(createdCampaign, this.teamId);
    } catch (error) {
      log.error("Failed to create Amazon campaign", { error, campaignData });
      throw error;
    }
  }

  async updateCampaign(
    campaignId: string,
    updates: Partial<Campaign>,
  ): Promise<Campaign> {
    if (!this.client) {
      throw new Error("Amazon client not initialized");
    }

    try {
      const amazonUpdates = this.transformToAmazonCampaign(updates);
      const updatedCampaign = await this.client.updateCampaign(
        campaignId,
        amazonUpdates,
      );

      return this.transformCampaign(updatedCampaign, this.teamId);
    } catch (error) {
      log.error("Failed to update Amazon campaign", {
        error,
        campaignId,
        updates,
      });
      throw error;
    }
  }

  async deleteCampaign(campaignId: string): Promise<void> {
    if (!this.client) {
      throw new Error("Amazon client not initialized");
    }

    try {
      await this.client.archiveCampaign(campaignId);
      log.info("Amazon campaign archived", { campaignId });
    } catch (error) {
      log.error("Failed to archive Amazon campaign", { error, campaignId });
      throw error;
    }
  }

  async updateCampaignStatus(
    campaignId: string,
    isActive: boolean,
  ): Promise<boolean> {
    if (!this.client) {
      throw new Error("Amazon client not initialized");
    }

    try {
      const state = isActive ? "enabled" : "paused";

      await this.client.updateCampaign(campaignId, { state });

      log.info("Amazon campaign status updated", {
        campaignId,
        isActive,
        state,
      });

      return true;
    } catch (error) {
      log.error("Failed to update Amazon campaign status", {
        error,
        campaignId,
        isActive,
      });

      return false;
    }
  }

  async updateCampaignBudget(
    campaignId: string,
    budget: number,
  ): Promise<boolean> {
    if (!this.client) {
      throw new Error("Amazon client not initialized");
    }

    try {
      await this.client.updateCampaign(campaignId, {
        budget: {
          budget,
          budgetType: "daily",
        },
      });

      log.info("Amazon campaign budget updated", { campaignId, budget });

      return true;
    } catch (error) {
      log.error("Failed to update Amazon campaign budget", {
        error,
        campaignId,
        budget,
      });

      return false;
    }
  }

  async getCampaignMetrics(
    campaignIds: string[],
    dateRange: { startDate: string; endDate: string },
  ): Promise<CampaignMetrics[]> {
    if (!this.client) {
      throw new Error("Amazon client not initialized");
    }

    try {
      const reportRequest = {
        campaignType: "sponsoredProducts" as const,
        metrics: [
          "campaignId",
          "campaignName",
          "date",
          "impressions",
          "clicks",
          "cost",
          "purchases1d",
          "purchases7d",
          "purchases14d",
          "purchases30d",
          "sales1d",
          "sales7d",
          "sales14d",
          "sales30d",
          "acos",
          "roas",
          "clickThroughRate",
        ],
        reportDate: dateRange.startDate,
        timeUnit: "DAILY" as const,
        format: "JSON" as const,
        filters: [
          {
            field: "campaignId",
            values: campaignIds,
          },
        ],
      };

      const reportData = await this.client.generateReport(reportRequest);

      return reportData.map(this.transformMetrics);
    } catch (error) {
      log.error("Failed to fetch Amazon campaign metrics", {
        error,
        campaignIds,
        dateRange,
      });
      throw error;
    }
  }

  async refreshToken(credentials: PlatformCredentials): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }> {
    if (!this.client) {
      throw new Error("Amazon client not initialized");
    }

    try {
      const amazonCredentials = credentials.credentials as AmazonAdsCredentials;
      const newTokens = await this.client.refreshToken(
        amazonCredentials.refresh_token,
      );

      // 클라이언트의 액세스 토큰 업데이트
      this.client.updateAccessToken(newTokens.access_token);

      return newTokens;
    } catch (error) {
      log.error("Failed to refresh Amazon token", { error });
      throw error;
    }
  }

  private transformCampaign(
    amazonCampaign: AmazonCampaign,
    teamId?: string,
  ): Campaign {
    const campaignId = amazonCampaign.campaignId.toString();

    return {
      id: campaignId,
      team_id: teamId || "", // Required field
      platform_campaign_id: campaignId,
      name: amazonCampaign.name,
      platform: "amazon" as any,
      status: amazonCampaign.state,
      is_active: amazonCampaign.state === "enabled",
      budget: amazonCampaign.budget?.budget || amazonCampaign.dailyBudget || 0,
      raw_data: amazonCampaign as any,
      synced_at: new Date().toISOString(),
      created_at: amazonCampaign.creationDate || new Date().toISOString(),
      updated_at: amazonCampaign.lastUpdatedDate || new Date().toISOString(),
    };
  }

  private transformToAmazonCampaign(
    campaign: Partial<Campaign>,
  ): Partial<AmazonCampaign> {
    const amazonCampaign: Partial<AmazonCampaign> = {};

    if (campaign.name) {
      amazonCampaign.name = campaign.name;
    }

    if (campaign.is_active !== undefined) {
      amazonCampaign.state = campaign.is_active ? "enabled" : "paused";
    }

    if (campaign.budget !== undefined && campaign.budget !== null) {
      amazonCampaign.budget = {
        budget: campaign.budget,
        budgetType: "daily",
      };
    }

    // 기본값 설정 (새 캠페인 생성 시)
    if (!campaign.id) {
      amazonCampaign.campaignType = "sponsoredProducts";
      amazonCampaign.targetingType = "manual";
      amazonCampaign.startDate = new Date().toISOString().split("T")[0];
    }

    return amazonCampaign;
  }

  private transformMetrics(amazonMetrics: any): CampaignMetrics {
    return {
      campaign_id: amazonMetrics.campaignId?.toString() || "",
      date: amazonMetrics.date,
      impressions: parseInt(amazonMetrics.impressions) || 0,
      clicks: parseInt(amazonMetrics.clicks) || 0,
      cost: parseFloat(amazonMetrics.cost) || 0,
      conversions: parseInt(amazonMetrics.purchases7d) || 0,
      revenue: parseFloat(amazonMetrics.sales7d) || 0,
      raw_data: amazonMetrics,
      created_at: new Date().toISOString(),
    };
  }

  private mapAmazonStatusToUnified(amazonStatus: string): string {
    const statusMap: Record<string, string> = {
      enabled: "ACTIVE",
      paused: "PAUSED",
      archived: "REMOVED",
    };

    return statusMap[amazonStatus] || "UNKNOWN";
  }

  async testConnection(): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      await this.client.getProfiles();

      return true;
    } catch (error) {
      log.error("Amazon connection test failed", { error });

      return false;
    }
  }

  async syncCampaigns(): Promise<Campaign[]> {
    try {
      const campaigns = await this.getCampaigns();

      log.info("Amazon campaigns synced", { count: campaigns.length });

      return campaigns;
    } catch (error) {
      log.error("Failed to sync Amazon campaigns", { error });
      throw error;
    }
  }

  // Amazon 특화 메서드들
  async getKeywords(campaignId?: string): Promise<any[]> {
    if (!this.client) {
      throw new Error("Amazon client not initialized");
    }

    const filters = campaignId ? { campaignIdFilter: campaignId } : {};

    return await this.client.getKeywords(filters);
  }

  async createKeywords(keywords: any[]): Promise<any[]> {
    if (!this.client) {
      throw new Error("Amazon client not initialized");
    }

    return await this.client.createKeywords(keywords);
  }

  async getProductTargets(campaignId?: string): Promise<any[]> {
    if (!this.client) {
      throw new Error("Amazon client not initialized");
    }

    const filters = campaignId ? { campaignIdFilter: campaignId } : {};

    return await this.client.getProductTargets(filters);
  }

  async createProductTargets(targets: any[]): Promise<any[]> {
    if (!this.client) {
      throw new Error("Amazon client not initialized");
    }

    return await this.client.createProductTargets(targets);
  }

  // Required interface methods
  setCredentials(credentials: Record<string, unknown>): void {
    this.credentials = credentials;
  }

  async validateCredentials(): Promise<boolean> {
    return await this.testConnection();
  }

  async fetchCampaigns(): Promise<Campaign[]> {
    const campaigns = await this.getCampaigns();

    // Ensure team_id is set for all campaigns
    return campaigns.map((campaign) => ({
      ...campaign,
      team_id: campaign.team_id || "",
    }));
  }

  async fetchCampaignMetrics(
    campaignId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CampaignMetrics[]> {
    const dateRange = {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    };

    return await this.getCampaignMetrics([campaignId], dateRange);
  }
}
