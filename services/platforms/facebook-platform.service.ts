import { MetaAdsIntegrationService } from "../meta-ads/meta-ads-integration.service";

import { BasePlatformService } from "./base-platform.service";
import {
  ConnectionTestResult,
  TokenRefreshResult,
  PlatformCredentials,
} from "./platform-service.interface";

import { PlatformConfigError } from "@/types/platform-errors.types";
import {
  Campaign,
  CampaignMetrics,
  PlatformType,
  FacebookCredentials,
} from "@/types";
import { Json } from "@/types/supabase.types";
import log from "@/utils/logger";
import { formatDateToYYYYMMDD } from "@/utils/date-formatter";

interface MetaAdAccount {
  id: string;
  name: string;
  currency: string;
  timezone: string;
  status: number;
}

export class FacebookPlatformService extends BasePlatformService<MetaAdsIntegrationService> {
  platform: PlatformType = "facebook";
  private accountId: string = "";

  constructor(credentials?: PlatformCredentials) {
    super(credentials);
  }

  async initialize(credentials: PlatformCredentials): Promise<void> {
    this.setCredentials(credentials);
    this.accountId = credentials.accountId || "";
    await this.initializeService();
  }

  private async initializeService(): Promise<void> {
    this.ensureInitialized();

    try {
      const metaCredentials = this.credentials!
        .additionalData as unknown as FacebookCredentials;

      if (!metaCredentials) {
        throw new PlatformConfigError(
          this.platform,
          "Meta credentials not found in additionalData",
        );
      }

      this.service = new MetaAdsIntegrationService({
        accessToken: this.credentials!.accessToken,
        appId: metaCredentials.appId,
        appSecret: metaCredentials.appSecret,
        businessId: metaCredentials.businessId,
      });

      log.info("Meta Ads platform service initialized", {
        accountId: this.accountId,
        businessId: metaCredentials.businessId,
      });
    } catch (error) {
      throw new PlatformConfigError(
        this.platform,
        "Failed to initialize Meta Ads service",
        undefined,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async testConnection(): Promise<ConnectionTestResult> {
    return this.executeWithErrorHandling(async () => {
      if (!this.service) {
        await this.initializeService();
      }

      if (!this.accountId) {
        // Get first available account if no account ID set
        const accounts = await this.getAccessibleAccounts();

        if (accounts.length === 0) {
          return {
            success: false,
            error: "No accessible Meta Ads accounts found",
          };
        }
        this.accountId = accounts[0].id;
      }

      try {
        const isConnected = await this.service!.testConnection(this.accountId);

        if (isConnected) {
          const accounts = await this.getAccessibleAccounts();
          const account = accounts.find((acc) => acc.id === this.accountId);

          return {
            success: true,
            accountInfo: {
              id: this.accountId,
              name: account?.name || "Meta Ads Account",
              currency: account?.currency,
              timezone: account?.timezone,
            },
          };
        } else {
          return {
            success: false,
            error: "Meta Ads connection test failed",
          };
        }
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

      if (!this.service) {
        await this.initializeService();
      }

      // Meta uses auto-refresh logic in the service
      const refreshResult = await this.service!.autoRefreshToken();

      if (refreshResult.success && refreshResult.newToken) {
        return {
          success: true,
          accessToken: refreshResult.newToken,
          // Meta doesn't always provide refresh token on refresh
          refreshToken: this.credentials!.refreshToken,
        };
      } else {
        return {
          success: false,
          error: refreshResult.error || "Token refresh failed",
        };
      }
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

      if (!this.accountId) {
        // Get first available account if no account ID set
        const accounts = await this.getAccessibleAccounts();

        if (accounts.length === 0) {
          throw new PlatformConfigError(
            this.platform,
            "No accessible Meta Ads accounts found",
          );
        }
        this.accountId = accounts[0].id;
      }

      // Get campaigns with last 30 days insights
      const endDate = new Date();
      const startDate = new Date();

      startDate.setDate(startDate.getDate() - 30);

      const metaCampaigns = await this.service!.getCampaignsWithInsights(
        this.accountId,
        formatDateToYYYYMMDD(startDate),
        formatDateToYYYYMMDD(endDate),
      );

      // Transform to platform common format
      return metaCampaigns.map((campaign) => ({
        id: `${this.accountId}_${campaign.id}`,
        team_id: this.teamId || "",
        platform: "facebook" as PlatformType,
        platform_campaign_id: campaign.id,
        name: campaign.name,
        status: this.mapStatus(campaign.status),
        budget: campaign.dailyBudget || campaign.lifetimeBudget || 0,
        is_active: campaign.status === "ACTIVE",
        raw_data: campaign as unknown as Json,
        synced_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
    }, "fetchCampaigns");
  }

  async fetchCampaignMetrics(
    campaignId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CampaignMetrics[]> {
    return this.executeWithErrorHandling(async () => {
      if (!this.service) {
        await this.initializeService();
      }

      // Convert date range to Meta format
      const daysDiff = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      let dateRange = "last_30d";

      if (daysDiff <= 1) dateRange = "today";
      else if (daysDiff <= 7) dateRange = "last_7d";
      else if (daysDiff <= 14) dateRange = "last_14d";
      else if (daysDiff <= 90) dateRange = "last_90d";

      const insights = await this.service!.getCampaignInsights(
        this.accountId,
        campaignId,
        dateRange,
      );

      if (!insights || insights.length === 0) {
        return [];
      }

      // Transform to platform common format
      return insights.map((insight) =>
        this.parseMetricsResponse({
          campaign_id: campaignId,
          date: insight.date_start || formatDateToYYYYMMDD(startDate),
          impressions: parseInt(insight.impressions || "0"),
          clicks: parseInt(insight.clicks || "0"),
          cost: parseFloat(insight.spend || "0"),
          conversions: this.extractConversions(insight.actions),
          revenue: 0,
          ctr: parseFloat(insight.ctr || "0") / 100, // Meta returns percentage
          cpc: parseFloat(insight.cpc || "0"),
          cpm: parseFloat(insight.cpm || "0"),
          roas: 0, // Would need conversion value data
          roi: 0,
          raw_data: insight,
          created_at: new Date().toISOString(),
        }),
      );
    }, "fetchCampaignMetrics");
  }

  async updateCampaignBudget(
    campaignId: string,
    budget: number,
  ): Promise<boolean> {
    return this.executeWithErrorHandling(async () => {
      if (!this.service) {
        await this.initializeService();
      }

      const success = await this.service!.updateCampaignBudget(
        campaignId,
        budget,
      );

      if (success) {
        log.info("Meta campaign budget updated", { campaignId, budget });
      }

      return success;
    }, "updateCampaignBudget");
  }

  async updateCampaignStatus(
    campaignId: string,
    isActive: boolean,
  ): Promise<boolean> {
    return this.executeWithErrorHandling(async () => {
      if (!this.service) {
        await this.initializeService();
      }

      const status = isActive ? "ACTIVE" : "PAUSED";
      const success = await this.service!.updateCampaignStatus(
        campaignId,
        status,
      );

      if (success) {
        log.info("Meta campaign status updated", {
          campaignId,
          isActive,
          status,
        });
      }

      return success;
    }, "updateCampaignStatus");
  }

  // Meta-specific methods
  async getAccessibleAccounts(): Promise<MetaAdAccount[]> {
    return this.executeWithErrorHandling(async () => {
      if (!this.service) {
        await this.initializeService();
      }

      const metaCredentials = this.credentials!
        .additionalData as unknown as FacebookCredentials;

      return await this.service!.getAdAccounts(metaCredentials?.businessId);
    }, "getAccessibleAccounts");
  }

  async getAccountInsights(dateRange: string = "last_30d"): Promise<unknown> {
    return this.executeWithErrorHandling(async () => {
      if (!this.service) {
        await this.initializeService();
      }

      return await this.service!.getAccountInsights(this.accountId, dateRange);
    }, "getAccountInsights");
  }

  async batchUpdateCampaignStatus(
    updates: Array<{ campaignId: string; status: "ACTIVE" | "PAUSED" }>,
  ): Promise<{ successful: string[]; failed: string[] }> {
    return this.executeWithErrorHandling(async () => {
      if (!this.service) {
        await this.initializeService();
      }

      return await this.service!.batchUpdateCampaignStatus(updates);
    }, "batchUpdateCampaignStatus");
  }

  async clearCache(pattern?: string): Promise<void> {
    return this.executeWithErrorHandling(async () => {
      if (!this.service) {
        await this.initializeService();
      }

      await this.service!.clearCache(pattern);
    }, "clearCache");
  }

  // Helper methods
  private extractConversions(
    actions?: Array<{ action_type: string; value: string }>,
  ): number {
    if (!actions) return 0;

    const conversionActionTypes = [
      "purchase",
      "lead",
      "complete_registration",
      "add_to_cart",
      "initiate_checkout",
      "onsite_conversion.purchase",
      "offsite_conversion.fb_pixel_purchase",
    ];

    return actions
      .filter((action) => conversionActionTypes.includes(action.action_type))
      .reduce((total, action) => total + parseInt(action.value || "0"), 0);
  }

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

  async cleanup(): Promise<void> {
    await super.cleanup?.();
    this.accountId = "";
    log.info("Meta Ads platform service cleanup completed");
  }
}
