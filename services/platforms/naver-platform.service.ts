import { BasePlatformService } from "./base-platform.service";
import {
  ConnectionTestResult,
  TokenRefreshResult,
} from "./platform-service.interface";

import {
  Campaign,
  CampaignMetrics,
  NaverCredentials,
  PlatformType,
} from "@/types";
import log from "@/utils/logger";

export class NaverPlatformService extends BasePlatformService {
  platform: PlatformType = "naver";

  async testConnection(): Promise<ConnectionTestResult> {
    return this.executeWithErrorHandling(async () => {
      // TODO: Implement actual Naver API connection test
      const isValid = await this.validateCredentials();

      return {
        success: isValid,
        accountInfo: {
          id: "naver-account",
          name: "Naver Search Ad Account",
        },
      };
    }, "testConnection");
  }

  async refreshToken(): Promise<TokenRefreshResult> {
    return this.executeWithErrorHandling(async () => {
      // TODO: Implement Naver token refresh
      return {
        success: true,
        accessToken: this.credentials?.accessToken || "",
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
      return {
        id: "naver-account",
        name: "Naver Search Ad Account",
        currency: "KRW",
        timezone: "Asia/Seoul",
      };
    }, "getAccountInfo");
  }

  async validateCredentials(): Promise<boolean> {
    const { apiKey, apiSecret, customerId } = this
      .credentials as unknown as NaverCredentials;

    if (!apiKey || !apiSecret || !customerId) {
      return false;
    }

    // TODO: Implement actual Naver API validation
    // For now, return true if credentials are present
    return true;
  }

  async fetchCampaigns(): Promise<Campaign[]> {
    log.info("Fetching Naver campaigns");

    // TODO: Implement Naver Search Ad API
    return [];
  }

  async fetchCampaignMetrics(
    _campaignId: string,
    _startDate: Date,
    _endDate: Date,
  ): Promise<CampaignMetrics[]> {
    log.info("Fetching Naver campaign metrics");

    // TODO: Implement
    return [];
  }

  async updateCampaignBudget(
    _campaignId: string,
    _budget: number,
  ): Promise<boolean> {
    log.info("Updating Naver campaign budget");

    // TODO: Implement
    return true;
  }

  async updateCampaignStatus(
    _campaignId: string,
    _isActive: boolean,
  ): Promise<boolean> {
    log.info("Updating Naver campaign status");

    // TODO: Implement
    return true;
  }
}
