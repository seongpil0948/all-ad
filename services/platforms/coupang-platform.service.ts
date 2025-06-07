import { BasePlatformService } from "./base-platform.service";

import {
  Campaign,
  CampaignMetrics,
  CoupangCredentials,
  PlatformType,
} from "@/types";
import log from "@/utils/logger";

export class CoupangPlatformService extends BasePlatformService {
  platform: PlatformType = "coupang";

  async validateCredentials(): Promise<boolean> {
    const { accessKey, secretKey, vendorId } = this
      .credentials as unknown as CoupangCredentials;

    if (!accessKey || !secretKey || !vendorId) {
      return false;
    }

    // TODO: Implement actual Coupang API validation
    // For now, return true if credentials are present
    return true;
  }

  async fetchCampaigns(): Promise<Campaign[]> {
    log.info("Fetching Coupang campaigns");

    // TODO: Implement Coupang Ads API
    return [];
  }

  async fetchCampaignMetrics(
    _campaignId: string,
    _startDate: Date,
    _endDate: Date,
  ): Promise<CampaignMetrics[]> {
    log.info("Fetching Coupang campaign metrics");

    // TODO: Implement
    return [];
  }

  async updateCampaignBudget(
    _campaignId: string,
    _budget: number,
  ): Promise<boolean> {
    log.info("Updating Coupang campaign budget");

    // TODO: Implement
    return true;
  }

  async updateCampaignStatus(
    _campaignId: string,
    _isActive: boolean,
  ): Promise<boolean> {
    log.info("Updating Coupang campaign status");

    // TODO: Implement
    return true;
  }
}
