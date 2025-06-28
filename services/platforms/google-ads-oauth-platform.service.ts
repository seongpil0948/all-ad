import type {
  Campaign,
  CampaignMetrics,
  PlatformType,
  CampaignStatus,
} from "@/types";

import { PlatformService } from "./platform-service.interface";

import { GoogleAdsOAuthIntegrationService } from "@/services/google-ads/google-ads-oauth-integration.service";
import log from "@/utils/logger";

export class GoogleAdsOAuthPlatformService implements PlatformService {
  platform: PlatformType = "google";
  private integrationService: GoogleAdsOAuthIntegrationService | null = null;
  private teamId: string | null = null;
  private customerId: string | null = null;

  setCredentials(credentials: Record<string, unknown>): void {
    // For OAuth flow, we only need teamId
    this.teamId = credentials.teamId as string;
    this.customerId = credentials.customerId as string | null;

    if (!this.teamId) {
      throw new Error("Team ID is required for Google Ads OAuth");
    }

    // Initialize the OAuth integration service
    this.integrationService = new GoogleAdsOAuthIntegrationService(
      this.teamId,
      this.customerId || undefined,
    );
  }

  async setMultiAccountCredentials(
    credentials: Record<string, unknown>,
  ): Promise<void> {
    // For now, handle the same as single account
    this.setCredentials(credentials);
  }

  async validateCredentials(): Promise<boolean> {
    if (!this.integrationService) {
      return false;
    }

    try {
      // Try to get account info to validate credentials
      const accountInfo = await this.integrationService.getAccountInfo();

      return !!accountInfo;
    } catch (error) {
      log.error(
        "Google Ads OAuth credentials validation failed",
        error as Error,
      );

      return false;
    }
  }

  async fetchCampaigns(): Promise<Campaign[]> {
    if (!this.integrationService) {
      throw new Error("Google Ads OAuth service not initialized");
    }

    try {
      const campaigns = await this.integrationService.getCampaigns();

      // Convert to Campaign type
      return campaigns.map((campaign) => ({
        id: campaign.id,
        team_id: this.teamId!,
        platform: "google" as PlatformType,
        platform_campaign_id: campaign.id.replace("google_", ""),
        name: campaign.name,
        status: campaign.status as CampaignStatus,
        is_active: campaign.status === "active",
        budget: campaign.budget,
        created_at: campaign.updatedAt,
        updated_at: campaign.updatedAt,
      }));
    } catch (error) {
      log.error("Failed to fetch Google Ads campaigns", error as Error);
      throw error;
    }
  }

  async fetchCampaignMetrics(
    campaignId: string,
    _startDate: Date,
    _endDate: Date,
  ): Promise<CampaignMetrics[]> {
    if (!this.integrationService) {
      throw new Error("Google Ads OAuth service not initialized");
    }

    // For now, return the current metrics
    // In a full implementation, we'd query metrics for the date range
    const campaigns = await this.integrationService.getCampaigns();
    const campaign = campaigns.find((c) => c.id === campaignId);

    if (!campaign) {
      return [];
    }

    return [
      {
        date: new Date().toISOString(),
        impressions: campaign.impressions,
        clicks: campaign.clicks,
        cost: campaign.cost,
        conversions: campaign.conversions,
        ctr: campaign.ctr,
      },
    ];
  }

  async updateCampaignStatus(
    campaignId: string,
    isActive: boolean,
  ): Promise<boolean> {
    if (!this.integrationService) {
      throw new Error("Google Ads OAuth service not initialized");
    }

    try {
      await this.integrationService.toggleCampaignStatus(campaignId, isActive);
      log.info("Campaign status updated", { campaignId, isActive });

      return true;
    } catch (error) {
      log.error("Failed to update campaign status", error as Error, {
        campaignId,
        isActive,
      });
      throw error;
    }
  }

  async updateCampaignBudget(
    campaignId: string,
    budget: number,
  ): Promise<boolean> {
    if (!this.integrationService) {
      throw new Error("Google Ads OAuth service not initialized");
    }

    try {
      // Convert to micros (Google Ads uses micros)
      const budgetMicros = Math.round(budget * 1_000_000);

      await this.integrationService.updateCampaignBudget(
        campaignId,
        budgetMicros,
      );
      log.info("Campaign budget updated", { campaignId, budget });

      return true;
    } catch (error) {
      log.error("Failed to update campaign budget", error as Error, {
        campaignId,
        budget,
      });
      throw error;
    }
  }

  async createCampaign(_campaign: Partial<Campaign>): Promise<Campaign> {
    throw new Error("Campaign creation not implemented for Google Ads OAuth");
  }

  async deleteCampaign(campaignId: string): Promise<void> {
    // In Google Ads, campaigns are not deleted but removed (status = REMOVED)
    if (!this.integrationService) {
      throw new Error("Google Ads OAuth service not initialized");
    }

    // For now, we'll pause the campaign instead
    await this.updateCampaignStatus(campaignId, false);
    log.warn("Campaign deletion requested, campaign paused instead", {
      campaignId,
    });
  }
}
