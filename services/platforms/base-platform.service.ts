import { PlatformService } from "./platform-service.interface";

import { Campaign, CampaignMetrics, PlatformType } from "@/types";
import { formatDateToYYYYMMDD } from "@/utils/date-formatter";
import log from "@/utils/logger";

export abstract class BasePlatformService<TService = any>
  implements PlatformService
{
  abstract platform: PlatformType;
  protected credentials: Record<string, unknown> = {};
  protected teamId?: string;
  protected service?: TService; // Platform-specific service instance

  constructor(credentials?: Record<string, unknown>) {
    if (credentials) {
      this.credentials = credentials;
    }
  }

  // Set credentials for use in subsequent operations
  setCredentials(credentials: Record<string, unknown>): void {
    this.credentials = credentials;
    this.service = undefined; // Reset service when credentials change
  }

  // Set team ID for platforms that need it
  setTeamId(teamId: string): void {
    this.teamId = teamId;
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

  protected parseMetricsResponse(
    data: Partial<CampaignMetrics>,
  ): CampaignMetrics {
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

  // Common error handling wrapper
  protected async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    operationName: string,
  ): Promise<T> {
    try {
      log.info(`${this.platform}: Starting ${operationName}`);
      const result = await operation();

      log.info(`${this.platform}: Completed ${operationName}`);

      return result;
    } catch (error) {
      log.error(`${this.platform}: Failed ${operationName}`, error);
      throw error;
    }
  }

  // Common validation for credentials
  protected validateRequiredFields(
    requiredFields: string[],
    credentials: Record<string, unknown> = this.credentials,
  ): boolean {
    for (const field of requiredFields) {
      if (!credentials[field]) {
        log.warn(
          `${this.platform}: Missing required credential field: ${field}`,
        );

        return false;
      }
    }

    return true;
  }
}
