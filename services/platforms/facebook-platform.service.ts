import { MetaAdsIntegrationService } from "../meta-ads/meta-ads-integration.service";

import { BasePlatformService } from "./base-platform.service";

import {
  Campaign,
  CampaignMetrics,
  PlatformType,
  FacebookCredentials,
} from "@/types";
import log from "@/utils/logger";
import { formatDateToYYYYMMDD } from "@/utils/date-formatter";

interface MetaAdAccount {
  id: string;
  name: string;
  currency: string;
  timezone: string;
  status: number;
}

export class FacebookPlatformService extends BasePlatformService {
  platform: PlatformType = "facebook";
  private metaAdsService?: MetaAdsIntegrationService;

  // Initialize Meta Ads service
  private getMetaAdsService(): MetaAdsIntegrationService {
    if (!this.metaAdsService) {
      const credentials = this.credentials as unknown as FacebookCredentials;

      this.metaAdsService = new MetaAdsIntegrationService({
        accessToken: credentials.accessToken || "",
        appId: credentials.appId,
        appSecret: credentials.appSecret,
        businessId: credentials.businessId,
      });
    }

    return this.metaAdsService;
  }

  async validateCredentials(): Promise<boolean> {
    const { accountId, accessToken } = this
      .credentials as unknown as FacebookCredentials;

    if (!accessToken || !accountId) {
      return false;
    }

    try {
      const service = this.getMetaAdsService();

      return await service.testConnection(accountId);
    } catch (error) {
      log.error("Facebook credential validation error:", error as Error);

      return false;
    }
  }

  async fetchCampaigns(): Promise<Campaign[]> {
    log.info("Fetching Facebook campaigns");

    try {
      const { accountId } = this.credentials as unknown as FacebookCredentials;
      const service = this.getMetaAdsService();

      // Get campaigns with last 30 days insights
      const endDate = new Date();
      const startDate = new Date();

      startDate.setDate(startDate.getDate() - 30);

      const metaCampaigns = await service.getCampaignsWithInsights(
        accountId,
        formatDateToYYYYMMDD(startDate),
        formatDateToYYYYMMDD(endDate),
      );

      // Transform to platform common format
      return metaCampaigns.map((campaign) => ({
        id: `${accountId}_${campaign.id}`,
        teamId: this.teamId || "",
        platform: "facebook" as PlatformType,
        platformCampaignId: campaign.id,
        accountId,
        name: campaign.name,
        status: this.mapStatus(campaign.status),
        budget: campaign.dailyBudget || campaign.lifetimeBudget || 0,
        isActive: campaign.status === "ACTIVE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metrics: campaign.metrics
          ? {
              impressions: campaign.metrics.impressions || 0,
              clicks: campaign.metrics.clicks || 0,
              cost: campaign.metrics.spend || 0,
              conversions: campaign.metrics.conversions || 0,
              revenue: 0, // Meta doesn't provide revenue directly
            }
          : undefined,
      }));
    } catch (error) {
      log.error("Failed to fetch Facebook campaigns", error as Error);
      throw error;
    }
  }

  async fetchCampaignMetrics(
    campaignId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CampaignMetrics[]> {
    log.info("Fetching Facebook campaign metrics", {
      campaignId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    try {
      const service = this.getMetaAdsService();
      const insights = await service.getCampaignInsights(
        campaignId,
        formatDateToYYYYMMDD(startDate),
        formatDateToYYYYMMDD(endDate),
      );

      if (!insights) {
        return [];
      }

      // Transform to platform common format
      return [
        {
          date: formatDateToYYYYMMDD(startDate),
          impressions: insights.impressions,
          clicks: insights.clicks,
          cost: insights.spend,
          conversions: insights.conversions,
          revenue: 0,
          ctr: insights.ctr,
          cpc: insights.cpc,
          cpm:
            insights.spend && insights.impressions
              ? (insights.spend / insights.impressions) * 1000
              : 0,
          roas: 0, // Would need conversion value data
        },
      ];
    } catch (error) {
      log.error("Failed to fetch campaign metrics", error as Error);
      throw error;
    }
  }

  async updateCampaignBudget(
    campaignId: string,
    budget: number,
  ): Promise<boolean> {
    log.info(`Updating Facebook campaign ${campaignId} budget to ${budget}`);

    try {
      const service = this.getMetaAdsService();

      return await service.updateCampaignBudget(campaignId, budget);
    } catch (error) {
      log.error("Failed to update campaign budget", error as Error);

      return false;
    }
  }

  async updateCampaignStatus(
    campaignId: string,
    isActive: boolean,
  ): Promise<boolean> {
    log.info(
      `Updating Facebook campaign ${campaignId} status to ${isActive ? "ACTIVE" : "PAUSED"}`,
    );

    try {
      const service = this.getMetaAdsService();

      return await service.updateCampaignStatus(
        campaignId,
        isActive ? "ACTIVE" : "PAUSED",
      );
    } catch (error) {
      log.error("Failed to update campaign status", error as Error);

      return false;
    }
  }

  // Map Facebook status to common status
  private mapStatus(facebookStatus: string): "active" | "paused" | "removed" {
    switch (facebookStatus) {
      case "ACTIVE":
        return "active";
      case "PAUSED":
        return "paused";
      case "DELETED":
      case "ARCHIVED":
        return "removed";
      default:
        return "paused";
    }
  }

  /**
   * Get all accessible ad accounts for account selection
   */
  async getAccessibleAccounts(): Promise<MetaAdAccount[]> {
    try {
      const service = this.getMetaAdsService();
      const credentials = this.credentials as unknown as FacebookCredentials;

      return await service.getAdAccounts(credentials.businessId);
    } catch (error) {
      log.error("Failed to fetch accessible accounts", error as Error);
      throw error;
    }
  }
}
