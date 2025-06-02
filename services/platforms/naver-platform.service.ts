import { BasePlatformService } from "./base-platform.service";

import { Campaign, CampaignMetrics, NaverCredentials } from "@/types/platform";
import { Logger } from "@/utils/logger";

export class NaverPlatformService extends BasePlatformService {
  platform = "naver" as const;

  async validateCredentials(): Promise<boolean> {
    const {
      access_token: api_key,
      secret_key,
      customer_id,
    } = this.credentials as NaverCredentials;

    if (!api_key || !secret_key || !customer_id) {
      return false;
    }

    try {
      // Validate credentials by making a test API call
      // TODO: Implement actual Naver API validation
      return true;
    } catch (error) {
      Logger.error("Naver credential validation error:", error as Error);

      return false;
    }
  }

  async fetchCampaigns(): Promise<Campaign[]> {
    Logger.info("Fetching Naver campaigns");

    // TODO: Implement Naver Search Ad API
    return [];
  }

  async fetchCampaignMetrics(
    _campaignId: string,
    _startDate: Date,
    _endDate: Date,
  ): Promise<CampaignMetrics[]> {
    Logger.info("Fetching Naver campaign metrics");

    // TODO: Implement
    return [];
  }

  async updateCampaignBudget(
    _campaignId: string,
    _budget: number,
  ): Promise<boolean> {
    Logger.info("Updating Naver campaign budget");

    // TODO: Implement
    return true;
  }

  async updateCampaignStatus(
    _campaignId: string,
    _isActive: boolean,
  ): Promise<boolean> {
    Logger.info("Updating Naver campaign status");

    // TODO: Implement
    return true;
  }
}
