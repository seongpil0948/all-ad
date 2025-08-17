import type {
  Campaign,
  CampaignMetrics,
  PlatformType,
  ConnectionTestResult,
  TokenRefreshResult,
} from "@/types";
import type { PlatformCredentials } from "./platform-service.interface";
import type { Json } from "@/types/supabase.types";

import { BasePlatformService } from "./base-platform.service";
import { TikTokAdsApi } from "./api-clients/tiktok-ads-api";
import { parsePlatformError } from "./common/error-parser";

import { PlatformError } from "@/types/platform-errors.types";
import {
  convertCredentialsFormat,
  calculateTokenExpiry,
} from "@/utils/platform-utils";

interface TikTokPlatformCredentials extends PlatformCredentials {
  id?: string;
  teamId?: string;
  accountName?: string;
}

interface TikTokCampaignTransformed {
  external_id: string;
  name: string;
  status: "active" | "paused";
  budget: number;
  platform: PlatformType;
  platform_credential_id: string;
  raw_data: unknown;
}

export class TikTokPlatformService extends BasePlatformService<TikTokAdsApi> {
  platform: PlatformType = "tiktok";

  protected get apiClient(): TikTokAdsApi {
    if (!this.service) {
      if (!this.credentials) {
        throw new PlatformError(
          "No credentials available",
          this.platform,
          "NO_CREDENTIALS",
          false,
          "Please connect your TikTok account first",
        );
      }
      this.service = this.createApiClient(this.credentials);
    }

    return this.service;
  }

  protected createApiClient(credentials: PlatformCredentials): TikTokAdsApi {
    // Use common utility to convert credentials format
    const credentialsObj = credentials as Record<string, unknown>;
    const credential = convertCredentialsFormat(credentialsObj, "tiktok", {
      tiktok_advertiser_id: credentialsObj.accountId,
    });

    return new TikTokAdsApi(credential);
  }

  async testConnection(): Promise<ConnectionTestResult> {
    return this.executeWithErrorHandling(async () => {
      const accountInfo = await this.apiClient.getAccountInfo();

      return {
        success: true,
        platform: this.platform,
        message: `Connected to TikTok Ads account: ${accountInfo.advertiser_name}`,
        accountInfo: {
          id: accountInfo.advertiser_id,
          name: accountInfo.advertiser_name,
          currency: accountInfo.currency,
          timezone: accountInfo.timezone,
        },
      };
    }, "testConnection");
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const result = await this.testConnection();

      return result.success;
    } catch {
      return false;
    }
  }

  async refreshToken(): Promise<TokenRefreshResult> {
    if (!this.credentials?.refreshToken) {
      throw new PlatformError(
        "No refresh token available",
        this.platform,
        "REFRESH_TOKEN_MISSING",
        false,
        "Please reconnect your TikTok account",
      );
    }

    return this.executeWithErrorHandling(async () => {
      const tokenData = await this.apiClient.refreshToken(
        this.credentials!.refreshToken!,
      );

      const newExpiresAt = calculateTokenExpiry(tokenData.expires_in);

      return {
        success: true,
        platform: this.platform,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: newExpiresAt.toISOString(),
        raw_response: tokenData,
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
      const account = await this.apiClient.getAccountInfo();

      return {
        id: account.advertiser_id,
        name: account.advertiser_name,
        currency: account.currency,
        timezone: account.timezone,
      };
    }, "getAccountInfo");
  }

  async fetchCampaigns(): Promise<Campaign[]> {
    return this.executeWithErrorHandling(async () => {
      const campaigns: Campaign[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await this.apiClient.getCampaigns(page);

        for (const tiktokCampaign of response.list) {
          const tiktokCreds = this.credentials as TikTokPlatformCredentials;
          const campaign = TikTokAdsApi.transformCampaign(
            tiktokCampaign,
            tiktokCreds?.id || "default-id",
          ) as TikTokCampaignTransformed;

          const fullCampaign: Campaign = {
            id: "", // Will be set by database
            team_id: tiktokCreds?.teamId || "",
            platform_campaign_id: campaign.external_id || "",
            name: campaign.name,
            status: campaign.status,
            budget: campaign.budget,
            platform: campaign.platform,
            platform_credential_id: campaign.platform_credential_id,
            is_active: campaign.status === "active",
            raw_data: campaign.raw_data as Json,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          campaigns.push(fullCampaign);
        }

        hasMore = page < response.page_info.total_page;
        page++;
      }

      return campaigns;
    }, "fetchCampaigns");
  }

  async fetchCampaignMetrics(
    campaignId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CampaignMetrics[]> {
    return this.executeWithErrorHandling(async () => {
      const metrics: CampaignMetrics[] = [];

      // Format dates as YYYY-MM-DD
      const start = startDate.toISOString().split("T")[0];
      const end = endDate.toISOString().split("T")[0];

      const response = await this.apiClient.getCampaignMetrics(
        [campaignId],
        start,
        end,
      );

      for (const tiktokMetric of response.list) {
        const metric = TikTokAdsApi.transformMetrics(tiktokMetric);

        metrics.push({
          ...metric,
          id: "", // Will be set by database
          campaign_id: campaignId,
          date: tiktokMetric.stat_time_day,
          created_at: new Date().toISOString(),
        } as CampaignMetrics);
      }

      return metrics;
    }, "fetchCampaignMetrics");
  }

  async updateCampaignStatus(
    campaignId: string,
    isActive: boolean,
  ): Promise<boolean> {
    return this.executeWithErrorHandling(async () => {
      const status = isActive ? "ENABLE" : "DISABLE";

      return await this.apiClient.updateCampaignStatus(campaignId, status);
    }, "updateCampaignStatus");
  }

  async updateCampaignBudget(
    campaignId: string,
    budget: number,
  ): Promise<boolean> {
    return this.executeWithErrorHandling(async () => {
      return await this.apiClient.updateCampaignBudget(campaignId, budget);
    }, "updateCampaignBudget");
  }

  protected parsePlatformError(error: unknown): PlatformError {
    // Use common error parser
    return parsePlatformError(error, this.platform);
  }
}
