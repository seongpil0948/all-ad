import { BasePlatformService } from "./base-platform.service";
import {
  ConnectionTestResult,
  TokenRefreshResult,
} from "./platform-service.interface";

import {
  Campaign,
  CampaignMetrics,
  KakaoCredentials,
  PlatformType,
} from "@/types";
import log from "@/utils/logger";

export class KakaoPlatformService extends BasePlatformService {
  platform: PlatformType = "kakao";

  async testConnection(): Promise<ConnectionTestResult> {
    return this.executeWithErrorHandling(async () => {
      // TODO: Implement actual Kakao API connection test
      const isValid = await this.validateCredentials();

      return {
        success: isValid,
        accountInfo: {
          id: "kakao-account",
          name: "Kakao Moment Account",
        },
      };
    }, "testConnection");
  }

  async refreshToken(): Promise<TokenRefreshResult> {
    return this.executeWithErrorHandling(async () => {
      // TODO: Implement Kakao token refresh
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
        id: "kakao-account",
        name: "Kakao Moment Account",
        currency: "KRW",
        timezone: "Asia/Seoul",
      };
    }, "getAccountInfo");
  }

  async validateCredentials(): Promise<boolean> {
    const { accessToken, accountId } = this
      .credentials as unknown as KakaoCredentials;

    if (!accessToken || !accountId) {
      return false;
    }

    // TODO: Implement actual Kakao API validation
    // For now, return true if credentials are present
    return true;
  }

  async fetchCampaigns(): Promise<Campaign[]> {
    log.info("Fetching Kakao campaigns");

    // TODO: Implement Kakao Moment API
    return [];
  }

  async fetchCampaignMetrics(
    _campaignId: string,
    _startDate: Date,
    _endDate: Date,
  ): Promise<CampaignMetrics[]> {
    log.info("Fetching Kakao campaign metrics");

    // TODO: Implement
    return [];
  }

  async updateCampaignBudget(
    _campaignId: string,
    _budget: number,
  ): Promise<boolean> {
    log.info("Updating Kakao campaign budget");

    // TODO: Implement
    return true;
  }

  async updateCampaignStatus(
    _campaignId: string,
    _isActive: boolean,
  ): Promise<boolean> {
    log.info("Updating Kakao campaign status");

    // TODO: Implement
    return true;
  }
}
