import { BasePlatformService } from "./base-platform.service";

import { Campaign, CampaignMetrics, KakaoCredentials } from "@/types/platform";
import { Logger } from "@/utils/logger";

export class KakaoPlatformService extends BasePlatformService {
  platform = "kakao" as const;

  async validateCredentials(): Promise<boolean> {
    const { access_token, ad_account_id } = this
      .credentials as KakaoCredentials;

    if (!access_token || !ad_account_id) {
      return false;
    }

    try {
      // Validate credentials by making a test API call
      // TODO: Implement actual Kakao API validation
      return true;
    } catch (error) {
      Logger.error("Kakao credential validation error:", error as Error);

      return false;
    }
  }

  async fetchCampaigns(): Promise<Campaign[]> {
    Logger.info("Fetching Kakao campaigns");

    // TODO: Implement Kakao Moment API
    return [];
  }

  async fetchCampaignMetrics(
    _campaignId: string,
    _startDate: Date,
    _endDate: Date,
  ): Promise<CampaignMetrics[]> {
    Logger.info("Fetching Kakao campaign metrics");

    // TODO: Implement
    return [];
  }

  async updateCampaignBudget(
    _campaignId: string,
    _budget: number,
  ): Promise<boolean> {
    Logger.info("Updating Kakao campaign budget");

    // TODO: Implement
    return true;
  }

  async updateCampaignStatus(
    _campaignId: string,
    _isActive: boolean,
  ): Promise<boolean> {
    Logger.info("Updating Kakao campaign status");

    // TODO: Implement
    return true;
  }
}
