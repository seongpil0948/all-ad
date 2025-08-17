import type {
  Campaign,
  CampaignMetrics,
  PlatformType,
  CampaignStatus,
} from "@/types";

import {
  ConnectionTestResult,
  TokenRefreshResult,
  PlatformCredentials,
} from "./platform-service.interface";
import { BasePlatformService } from "./base-platform.service";

import { PlatformConfigError } from "@/types/platform-errors.types";
import { GoogleAdsOAuthIntegrationService } from "@/services/google-ads/google-ads-oauth-integration.service";
import log from "@/utils/logger";

export class GoogleAdsOAuthPlatformService extends BasePlatformService<GoogleAdsOAuthIntegrationService> {
  platform: PlatformType = "google";
  private customerId: string | null = null;

  constructor(credentials?: PlatformCredentials) {
    super(credentials);
  }

  async initialize(credentials: PlatformCredentials): Promise<void> {
    this.setCredentials(credentials);
    this.teamId = credentials.accountId || "";
    this.customerId = credentials.customerId as string | null;
    await this.initializeService();
  }

  private async initializeService(): Promise<void> {
    this.ensureInitialized();

    if (!this.teamId) {
      throw new PlatformConfigError(
        this.platform,
        "Team ID is required for Google Ads OAuth",
      );
    }

    if (!this.customerId) {
      throw new PlatformConfigError(
        this.platform,
        "Google Ads Customer ID is missing. Please disconnect and reconnect your Google Ads account to resolve this issue.",
      );
    }

    try {
      this.service = new GoogleAdsOAuthIntegrationService(
        this.teamId,
        this.customerId,
      );

      log.info("Google Ads OAuth platform service initialized", {
        teamId: this.teamId,
        customerId: this.customerId,
      });
    } catch (error) {
      throw new PlatformConfigError(
        this.platform,
        "Failed to initialize Google Ads OAuth service",
        undefined,
        error instanceof Error ? error : undefined,
      );
    }
  }

  setCredentials(credentials: PlatformCredentials): void {
    super.setCredentials(credentials);
    this.teamId = credentials.accountId || "";
    this.customerId = credentials.customerId as string | null;
  }

  async testConnection(): Promise<ConnectionTestResult> {
    return this.executeWithErrorHandling(async () => {
      if (!this.service) {
        await this.initializeService();
      }

      try {
        await this.service!.getCampaigns();

        return {
          success: true,
          accountInfo: {
            id: this.customerId || "unknown",
            name: "Google Ads Account",
            currency: "USD", // Default, would need to be fetched from API
            timezone: "UTC", // Default, would need to be fetched from API
          },
        };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Connection test failed",
        };
      }
    }, "testConnection");
  }

  async validateCredentials(): Promise<boolean> {
    return this.executeWithErrorHandling(async () => {
      if (!this.validateRequiredFields(["accessToken"])) {
        return false;
      }

      const result = await this.testConnection();

      return result.success;
    }, "validateCredentials");
  }

  async refreshToken(): Promise<TokenRefreshResult> {
    return this.executeWithErrorHandling(async () => {
      this.ensureInitialized();

      // Google Ads OAuth uses simplified flow - token managed by OAuth service
      // Return current token as is since it's managed automatically
      return {
        success: true,
        accessToken: this.credentials!.accessToken,
        refreshToken: this.credentials!.refreshToken,
      };
    }, "refreshToken");
  }

  async getAccountInfo(): Promise<{
    id: string;
    name: string;
    currency?: string;
    timezone?: string;
  }> {
    return this.executeWithErrorHandling(async () => {
      const testResult = await this.testConnection();

      if (!testResult.success || !testResult.accountInfo) {
        throw new PlatformConfigError(
          this.platform,
          "Failed to get account info",
        );
      }

      return testResult.accountInfo;
    }, "getAccountInfo");
  }

  async fetchCampaigns(): Promise<Campaign[]> {
    return this.executeWithErrorHandling(async () => {
      if (!this.service) {
        await this.initializeService();
      }

      const campaigns = await this.service!.getCampaigns();

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
    }, "fetchCampaigns");
  }

  async fetchCampaignMetrics(campaignId: string): Promise<CampaignMetrics[]> {
    return this.executeWithErrorHandling(async () => {
      if (!this.service) {
        await this.initializeService();
      }

      // For now, return the current metrics
      // In a full implementation, we'd query metrics for the date range
      const campaigns = await this.service!.getCampaigns();
      const campaign = campaigns.find((c) => c.id === campaignId);

      if (!campaign) {
        return [];
      }

      return [
        this.parseMetricsResponse({
          campaign_id: campaignId,
          date: new Date().toISOString(),
          impressions: campaign.impressions,
          clicks: campaign.clicks,
          cost: campaign.cost,
          conversions: campaign.conversions,
          ctr: campaign.ctr,
          raw_data: campaign as unknown as Record<string, unknown>,
          created_at: new Date().toISOString(),
        }),
      ];
    }, "fetchCampaignMetrics");
  }

  async updateCampaignStatus(
    campaignId: string,
    isActive: boolean,
  ): Promise<boolean> {
    return this.executeWithErrorHandling(async () => {
      if (!this.service) {
        await this.initializeService();
      }

      await this.service!.toggleCampaignStatus(campaignId, isActive);
      log.info("Google Ads campaign status updated", { campaignId, isActive });

      return true;
    }, "updateCampaignStatus");
  }

  async updateCampaignBudget(
    campaignId: string,
    budget: number,
  ): Promise<boolean> {
    return this.executeWithErrorHandling(async () => {
      if (!this.service) {
        await this.initializeService();
      }

      // Convert to micros (Google Ads uses micros)
      const budgetMicros = Math.round(budget * 1_000_000);

      await this.service!.updateCampaignBudget(campaignId, budgetMicros);
      log.info("Google Ads campaign budget updated", { campaignId, budget });

      return true;
    }, "updateCampaignBudget");
  }

  async createCampaign(): Promise<Campaign> {
    throw new Error("Campaign creation not implemented for Google Ads OAuth");
  }

  async deleteCampaign(campaignId: string): Promise<void> {
    return this.executeWithErrorHandling(async () => {
      // In Google Ads, campaigns are not deleted but removed (status = REMOVED)
      // For now, we'll pause the campaign instead
      await this.updateCampaignStatus(campaignId, false);
      log.warn(
        "Google Ads campaign deletion requested, campaign paused instead",
        {
          campaignId,
        },
      );
    }, "deleteCampaign");
  }

  async cleanup(): Promise<void> {
    await super.cleanup?.();
    this.customerId = null;
    log.info("Google Ads OAuth platform service cleanup completed");
  }
}
