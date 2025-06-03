import { BasePlatformService } from "./base-platform.service";

import {
  Campaign,
  CampaignMetrics,
  NaverCredentials,
  PlatformType,
} from "@/types";
import log from "@/utils/logger";

export class NaverPlatformService extends BasePlatformService {
  platform: PlatformType = "naver";

  async validateCredentials(): Promise<boolean> {
    const { apiKey, apiSecret, customerId } = this
      .credentials as NaverCredentials;

    if (!apiKey || !apiSecret || !customerId) {
      return false;
    }

    try {
      // Validate credentials by making a test API call
      // TODO: Implement actual Naver API validation
      return true;
    } catch (error) {
      log.error("Naver credential validation error:", error as Error);

      return false;
    }
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
