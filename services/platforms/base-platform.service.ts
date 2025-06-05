import { PlatformService } from "./platform-service.interface";

import { Campaign, CampaignMetrics, PlatformType } from "@/types";
import { formatDateToYYYYMMDD } from "@/utils/date-formatter";

export abstract class BasePlatformService implements PlatformService {
  abstract platform: PlatformType;
  protected credentials: Record<string, any> = {};
  protected teamId?: string;

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
    return formatDateToYYYYMMDD(date);
  }

  protected parseMetricsResponse(data: any): CampaignMetrics {
    // Default implementation - can be overridden by specific platforms
    return {
      impressions: 0,
      clicks: 0,
      cost: 0,
      conversions: 0,
      revenue: 0,
      ctr: 0,
      cpc: 0,
      cpm: 0,
      roas: 0,
      roi: 0,
      date: new Date().toISOString().split("T")[0],
      ...data,
    };
  }
}
