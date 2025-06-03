import { BasePlatformService } from "./base-platform.service";

import {
  Campaign,
  CampaignMetrics,
  KakaoCredentials,
  PlatformType,
} from "@/types";
import log from "@/utils/logger";

export class KakaoPlatformService extends BasePlatformService {
  platform: PlatformType = "kakao";

  async validateCredentials(): Promise<boolean> {
    const { accessToken, accountId } = this.credentials as KakaoCredentials;

    if (!accessToken || !accountId) {
      return false;
    }

    try {
      // Validate credentials by making a test API call
      // TODO: Implement actual Kakao API validation
      return true;
    } catch (error) {
      log.error("Kakao credential validation error:", error as Error);

      return false;
    }
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
