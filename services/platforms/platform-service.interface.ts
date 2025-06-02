import { Campaign, CampaignMetrics, PlatformType } from "@/types/platform";

// Common interface for all platform services
export interface PlatformService {
  platform: PlatformType;

  // Set credentials for the service
  setCredentials(credentials: Record<string, any>): void;

  // Validate credentials
  validateCredentials(): Promise<boolean>;

  // Fetch campaigns from the platform
  fetchCampaigns(): Promise<Campaign[]>;

  // Fetch campaign metrics
  fetchCampaignMetrics(
    campaignId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CampaignMetrics[]>;

  // Update campaign budget
  updateCampaignBudget(campaignId: string, budget: number): Promise<boolean>;

  // Update campaign status (active/paused)
  updateCampaignStatus(campaignId: string, isActive: boolean): Promise<boolean>;
}

// Platform service factory
export interface PlatformServiceFactory {
  createService(platform: PlatformType): PlatformService;
}
