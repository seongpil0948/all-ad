import { BasePlatformService } from "./base-platform.service";
import {
  ConnectionTestResult,
  TokenRefreshResult,
  PlatformCredentials,
} from "./platform-service.interface";
import {
  AmazonAdsApiClient,
  AmazonAdsCredentials,
  AmazonCampaign,
  AmazonReportData,
  AmazonKeyword,
  AmazonProductTarget,
} from "./api-clients/amazon-ads-api";

import {
  PlatformAuthError,
  PlatformConfigError,
} from "@/types/platform-errors.types";
import { Campaign, PlatformType } from "@/types";
import { CampaignMetrics } from "@/types/campaign.types";
import { Json } from "@/types/supabase.types";
import log from "@/utils/logger";
import {
  parseIntValue,
  parseNumericValue,
  sanitizeForJson,
} from "@/utils/platform-utils";

export class AmazonPlatformService extends BasePlatformService<AmazonAdsApiClient> {
  public platform: PlatformType = "amazon";

  constructor(credentials?: PlatformCredentials) {
    super(credentials);
  }

  async initialize(credentials: PlatformCredentials): Promise<void> {
    this.setCredentials(credentials);
    this.teamId = credentials.accountId || "";
    await this.initializeClient();
  }

  private async initializeClient(): Promise<void> {
    this.ensureInitialized();

    try {
      const amazonCredentials = this.credentials!
        .additionalData as unknown as AmazonAdsCredentials;

      if (!amazonCredentials) {
        throw new PlatformConfigError(
          this.platform,
          "Amazon credentials not found in additionalData",
        );
      }

      // 지역 정보를 자격 증명에서 추출하거나 기본값 사용
      const region = this.getRegionFromCountryCode(
        amazonCredentials.country_code,
      );

      this.service = new AmazonAdsApiClient(amazonCredentials, region);

      log.info("Amazon platform service initialized", {
        profileId: amazonCredentials.profile_id,
        countryCode: amazonCredentials.country_code,
        region,
        teamId: this.teamId,
      });
    } catch (error) {
      throw new PlatformConfigError(
        this.platform,
        "Failed to initialize Amazon API client",
        undefined,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async testConnection(): Promise<ConnectionTestResult> {
    return this.executeWithErrorHandling(async () => {
      if (!this.service) {
        await this.initializeClient();
      }

      try {
        const profiles = await this.service!.getProfiles();
        const profile = profiles[0];

        return {
          success: true,
          accountInfo: {
            id: profile?.profileId?.toString() || "unknown",
            name: profile?.accountInfo?.name || "Amazon Account",
            currency: profile?.currencyCode,
            timezone: profile?.timezone,
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

      if (!this.service) {
        await this.initializeClient();
      }

      const refreshToken = this.credentials!.refreshToken;

      if (!refreshToken) {
        throw new PlatformAuthError(
          this.platform,
          "Refresh token not available",
        );
      }

      try {
        const newTokens = await this.service!.refreshToken(refreshToken);

        // 클라이언트의 액세스 토큰 업데이트
        this.service!.updateAccessToken(newTokens.access_token);

        return {
          success: true,
          accessToken: newTokens.access_token,
          refreshToken: newTokens.refresh_token,
          expiresAt: new Date(Date.now() + newTokens.expires_in * 1000),
        };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Token refresh failed",
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
        await this.initializeClient();
      }

      const amazonCampaigns = await this.service!.getCampaigns({
        stateFilter: "enabled,paused",
      });

      return amazonCampaigns.map((campaign) =>
        this.transformCampaign(campaign, this.teamId),
      );
    }, "fetchCampaigns");
  }

  async fetchCampaignMetrics(
    campaignId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CampaignMetrics[]> {
    return this.executeWithErrorHandling(async () => {
      if (!this.service) {
        await this.initializeClient();
      }

      const dateRange = {
        startDate: this.formatDate(startDate),
        endDate: this.formatDate(endDate),
      };

      return await this.getCampaignMetrics([campaignId], dateRange);
    }, "fetchCampaignMetrics");
  }

  async updateCampaignBudget(
    campaignId: string,
    budget: number,
  ): Promise<boolean> {
    return this.executeWithErrorHandling(async () => {
      if (!this.service) {
        await this.initializeClient();
      }

      await this.service!.updateCampaign(campaignId, {
        budget: {
          budget,
          budgetType: "daily",
        },
      });

      log.info("Amazon campaign budget updated", { campaignId, budget });

      return true;
    }, "updateCampaignBudget");
  }

  async updateCampaignStatus(
    campaignId: string,
    isActive: boolean,
  ): Promise<boolean> {
    return this.executeWithErrorHandling(async () => {
      if (!this.service) {
        await this.initializeClient();
      }

      const state = isActive ? "enabled" : "paused";

      await this.service!.updateCampaign(campaignId, { state });

      log.info("Amazon campaign status updated", {
        campaignId,
        isActive,
        state,
      });

      return true;
    }, "updateCampaignStatus");
  }

  // Amazon-specific methods
  async createCampaign(campaignData: Partial<Campaign>): Promise<Campaign> {
    return this.executeWithErrorHandling(async () => {
      if (!this.service) {
        await this.initializeClient();
      }

      const amazonCampaignData = this.transformToAmazonCampaign(campaignData);
      const createdCampaign =
        await this.service!.createCampaign(amazonCampaignData);

      return this.transformCampaign(createdCampaign, this.teamId);
    }, "createCampaign");
  }

  async updateCampaign(
    campaignId: string,
    updates: Partial<Campaign>,
  ): Promise<Campaign> {
    return this.executeWithErrorHandling(async () => {
      if (!this.service) {
        await this.initializeClient();
      }

      const amazonUpdates = this.transformToAmazonCampaign(updates);
      const updatedCampaign = await this.service!.updateCampaign(
        campaignId,
        amazonUpdates,
      );

      return this.transformCampaign(updatedCampaign, this.teamId);
    }, "updateCampaign");
  }

  async deleteCampaign(campaignId: string): Promise<void> {
    return this.executeWithErrorHandling(async () => {
      if (!this.service) {
        await this.initializeClient();
      }

      await this.service!.archiveCampaign(campaignId);
      log.info("Amazon campaign archived", { campaignId });
    }, "deleteCampaign");
  }

  async getCampaignMetrics(
    campaignIds: string[],
    dateRange: { startDate: string; endDate: string },
  ): Promise<CampaignMetrics[]> {
    return this.executeWithErrorHandling(async () => {
      if (!this.service) {
        await this.initializeClient();
      }

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

      const reportData = await this.service!.generateReport(reportRequest);

      return reportData.map(this.transformMetrics);
    }, "getCampaignMetrics");
  }

  // Amazon specialized methods
  async getKeywords(campaignId?: string): Promise<AmazonKeyword[]> {
    return this.executeWithErrorHandling(async () => {
      if (!this.service) {
        await this.initializeClient();
      }

      const filters: Record<string, string> | undefined = campaignId
        ? { campaignIdFilter: campaignId }
        : undefined;

      return await this.service!.getKeywords(filters);
    }, "getKeywords");
  }

  async createKeywords(
    keywords: Partial<AmazonKeyword>[],
  ): Promise<AmazonKeyword[]> {
    return this.executeWithErrorHandling(async () => {
      if (!this.service) {
        await this.initializeClient();
      }

      return await this.service!.createKeywords(keywords);
    }, "createKeywords");
  }

  async getProductTargets(campaignId?: string): Promise<AmazonProductTarget[]> {
    return this.executeWithErrorHandling(async () => {
      if (!this.service) {
        await this.initializeClient();
      }

      const filters: Record<string, string> | undefined = campaignId
        ? { campaignIdFilter: campaignId }
        : undefined;

      return await this.service!.getProductTargets(filters);
    }, "getProductTargets");
  }

  async createProductTargets(
    targets: Partial<AmazonProductTarget>[],
  ): Promise<AmazonProductTarget[]> {
    return this.executeWithErrorHandling(async () => {
      if (!this.service) {
        await this.initializeClient();
      }

      return await this.service!.createProductTargets(targets);
    }, "createProductTargets");
  }

  // Helper methods
  private convertToJson(obj: Record<string, unknown>): Json {
    return JSON.parse(JSON.stringify(obj)) as Json;
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

  private transformCampaign(
    amazonCampaign: AmazonCampaign,
    teamId?: string,
  ): Campaign {
    const campaignId = amazonCampaign.campaignId.toString();

    return {
      id: campaignId,
      team_id: teamId || "",
      platform_campaign_id: campaignId,
      name: amazonCampaign.name,
      platform: "amazon",
      status: amazonCampaign.state,
      is_active: amazonCampaign.state === "enabled",
      budget: amazonCampaign.budget?.budget || amazonCampaign.dailyBudget || 0,
      raw_data: this.convertToJson(
        amazonCampaign as unknown as Record<string, unknown>,
      ),
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

  private transformMetrics(amazonMetrics: AmazonReportData): CampaignMetrics {
    return {
      campaign_id: amazonMetrics.campaignId?.toString() || "",
      date:
        (amazonMetrics.date as string) ||
        new Date().toISOString().split("T")[0],
      impressions: parseIntValue(amazonMetrics.impressions),
      clicks: parseIntValue(amazonMetrics.clicks),
      cost: parseNumericValue(amazonMetrics.cost),
      conversions: parseIntValue(amazonMetrics.purchases7d),
      revenue: parseNumericValue(amazonMetrics.sales7d),
      ctr: parseNumericValue(amazonMetrics.clickThroughRate),
      cpc:
        parseNumericValue(amazonMetrics.cost) /
        Math.max(parseNumericValue(amazonMetrics.clicks), 1),
      cpm:
        (parseNumericValue(amazonMetrics.cost) /
          Math.max(parseNumericValue(amazonMetrics.impressions), 1)) *
        1000,
      roas: parseNumericValue(amazonMetrics.roas),
      roi:
        (parseNumericValue(amazonMetrics.sales7d) -
          parseNumericValue(amazonMetrics.cost)) /
        Math.max(parseNumericValue(amazonMetrics.cost), 1),
      raw_data: sanitizeForJson(amazonMetrics) as Record<string, unknown>,
      created_at: new Date().toISOString(),
    };
  }

  async cleanup(): Promise<void> {
    await super.cleanup?.();
    log.info("Amazon platform service cleanup completed");
  }
}
