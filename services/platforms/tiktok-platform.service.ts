import type {
  Campaign,
  CampaignMetrics,
  PlatformCredential,
  PlatformType,
  ConnectionTestResult,
  TokenRefreshResult,
} from "@/types";
import type { PlatformCredentials } from "./platform-service.interface";

import { BasePlatformService } from "./base-platform.service";
import { TikTokAdsApi } from "./api-clients/tiktok-ads-api";

import { PlatformError } from "@/types/platform-errors.types";

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
    // Convert PlatformCredentials to PlatformCredential format expected by API
    const credential: PlatformCredential = {
      id: (credentials as any).id || "",
      team_id: (credentials as any).teamId || "",
      platform: "tiktok",
      account_id: credentials.accountId || "",
      account_name: (credentials as any).accountName || null,
      access_token: credentials.accessToken || null,
      refresh_token: credentials.refreshToken || null,
      expires_at: credentials.expiresAt
        ? typeof credentials.expiresAt === "string"
          ? credentials.expiresAt
          : credentials.expiresAt.toISOString()
        : null,
      scope: "ads.management,reporting",
      is_active: true,
      credentials: {},
      data: {
        ...credentials.additionalData,
        tiktok_advertiser_id: credentials.accountId,
      },
      error_message: null,
      last_synced_at: null,
      created_at: new Date().toISOString(),
      created_by: "",
      updated_at: new Date().toISOString(),
    };

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

      const newExpiresAt = new Date();

      newExpiresAt.setSeconds(newExpiresAt.getSeconds() + tokenData.expires_in);

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
          const campaign = TikTokAdsApi.transformCampaign(
            tiktokCampaign,
            (this.credentials as any)?.id || "default-id",
          );

          campaigns.push({
            ...campaign,
            id: "", // Will be set by database
            team_id: (this.credentials as any)?.teamId || "",
            platform_campaign_id: (campaign as any).external_id || "",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as Campaign);
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

  protected parsePlatformError(error: any): PlatformError {
    // Handle TikTok-specific error codes
    const errorCode = error.code || "UNKNOWN_ERROR";
    const errorMessage = error.message || "An unknown error occurred";

    // TikTok API error codes
    const retryableErrors = [
      40001, // Rate limit
      50001, // Internal server error
      50002, // Service unavailable
    ];

    const authErrors = [
      40100, // Invalid access token
      40101, // Access token expired
      40102, // Invalid refresh token
    ];

    let platformErrorCode = "UNKNOWN_ERROR";
    let retryable = false;
    let userMessage = errorMessage;

    if (authErrors.includes(errorCode)) {
      platformErrorCode = "AUTH_ERROR";
      retryable = true;
      userMessage =
        "Authentication failed. Please reconnect your TikTok account.";
    } else if (retryableErrors.includes(errorCode)) {
      platformErrorCode = errorCode === 40001 ? "RATE_LIMIT" : "API_ERROR";
      retryable = true;
      userMessage = "Temporary issue with TikTok. Please try again later.";
    } else if (error.message?.includes("Network")) {
      platformErrorCode = "NETWORK_ERROR";
      retryable = true;
      userMessage =
        "Network connection issue. Please check your internet connection.";
    }

    return new PlatformError(
      errorMessage,
      this.platform,
      platformErrorCode,
      retryable,
      userMessage,
    );
  }
}
