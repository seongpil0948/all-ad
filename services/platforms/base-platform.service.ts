import { PlatformService } from "./platform-service.interface";

import { Campaign, CampaignMetrics, PlatformType } from "@/types/platform";

export abstract class BasePlatformService implements PlatformService {
  abstract platform: PlatformType;
  protected credentials: Record<string, any> = {};

  // Set credentials for use in subsequent operations
  setCredentials(credentials: Record<string, any>): void {
    this.credentials = credentials;
  }

  abstract validateCredentials(): Promise<boolean>;

  abstract fetchCampaigns(): Promise<Campaign[]>;

  abstract fetchCampaignMetrics(
    campaignId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CampaignMetrics[]>;

  abstract updateCampaignBudget(
    campaignId: string,
    budget: number,
  ): Promise<boolean>;

  abstract updateCampaignStatus(
    campaignId: string,
    isActive: boolean,
  ): Promise<boolean>;

  // Common helper methods
  protected formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
  }

  protected parseMetricsResponse(data: any): CampaignMetrics {
    // Default implementation - can be overridden by specific platforms
    return {
      id: "",
      campaign_id: "",
      date: "",
      impressions: 0,
      clicks: 0,
      conversions: 0,
      cost: 0,
      revenue: 0,
      created_at: new Date().toISOString(),
      ...data,
    };
  }
}
