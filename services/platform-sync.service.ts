import { platformServiceFactory } from "./platforms/platform-service-factory";
import { PlatformDatabaseService } from "./platform-database.service";

import { PlatformType } from "@/types/platform";
import { Logger } from "@/utils/logger";
import { Campaign as DBCampaign } from "@/types/database.types";
import {
  Campaign as PlatformCampaign,
  CampaignMetrics,
} from "@/types/platform";
import { createClient } from "@/utils/supabase/server";

export class PlatformSyncService {
  async syncAllPlatforms(
    teamId: string,
    _userId: string,
  ): Promise<{
    success: boolean;
    results: Record<PlatformType, { success: boolean; error?: string }>;
  }> {
    const results: Record<string, { success: boolean; error?: string }> = {};

    try {
      // Get all active credentials for the team
      const credentials = await this.getTeamCredentials(teamId);

      // Sync each platform
      for (const credential of credentials) {
        try {
          const success = await this.syncPlatform(
            teamId,
            credential.platform as PlatformType,
            credential.credentials,
          );

          results[credential.platform] = { success };
        } catch (error) {
          results[credential.platform] = {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      }

      return {
        success: Object.values(results).every((r) => r.success),
        results: results as Record<
          PlatformType,
          { success: boolean; error?: string }
        >,
      };
    } catch (error) {
      Logger.error("Sync all platforms error:", error as Error);

      return {
        success: false,
        results: {} as Record<
          PlatformType,
          { success: boolean; error?: string }
        >,
      };
    }
  }

  async syncPlatform(
    teamId: string,
    platform: PlatformType,
    credentials: Record<string, any>,
  ): Promise<boolean> {
    try {
      const service = platformServiceFactory.createService(platform);

      // Set credentials on the service
      service.setCredentials(credentials);

      // Validate credentials first
      const isValid = await service.validateCredentials();

      if (!isValid) {
        throw new Error("Invalid credentials");
      }

      // Fetch campaigns from the platform
      const campaigns = await service.fetchCampaigns();

      // Save campaigns to database and get saved campaigns with IDs
      const savedCampaigns = await this.syncCampaigns(
        teamId,
        platform,
        campaigns,
      );

      // Fetch metrics for each campaign (last 30 days)
      const endDate = new Date();
      const startDate = new Date();

      startDate.setDate(startDate.getDate() - 30);

      for (const savedCampaign of savedCampaigns) {
        const platformCampaign = campaigns.find(
          (c) => c.platform_campaign_id === savedCampaign.platform_campaign_id,
        );

        if (platformCampaign && platformCampaign.platform_campaign_id) {
          try {
            const metrics = await service.fetchCampaignMetrics(
              platformCampaign.platform_campaign_id,
              startDate,
              endDate,
            );

            // Save metrics to database
            if (metrics.length > 0) {
              await this.saveCampaignMetrics(savedCampaign.id, metrics);
            }
          } catch (error) {
            Logger.error(
              `Failed to sync metrics for campaign ${platformCampaign.platform_campaign_id}:`,
              error as Error,
            );
          }
        }
      }

      // Update sync time
      const dbService = new PlatformDatabaseService();

      await dbService.updateCampaignSyncTime(teamId, platform);

      return true;
    } catch (error) {
      Logger.error(`Platform sync error for ${platform}:`, error as Error);
      throw error;
    }
  }

  async updateCampaignBudget(
    campaignId: string,
    platform: PlatformType,
    platformCampaignId: string,
    budget: number,
    teamId: string,
  ): Promise<boolean> {
    try {
      // Get platform credentials
      const credentials = await this.getTeamCredentials(teamId);
      const platformCredential = credentials.find(
        (c: any) => c.platform === platform,
      );

      if (!platformCredential) {
        throw new Error(`No credentials found for platform: ${platform}`);
      }

      // Update on the platform
      const service = platformServiceFactory.createService(platform);

      service.setCredentials(platformCredential.credentials);

      const platformSuccess = await service.updateCampaignBudget(
        platformCampaignId,
        budget,
      );

      if (!platformSuccess) {
        throw new Error("Failed to update budget on platform");
      }

      // Update in database
      const dbSuccess = await this.updateCampaignSettings(campaignId, {
        budget,
      });

      return dbSuccess;
    } catch (error) {
      Logger.error("Update campaign budget error:", error as Error);

      return false;
    }
  }

  async updateCampaignStatus(
    campaignId: string,
    platform: PlatformType,
    platformCampaignId: string,
    isActive: boolean,
    teamId: string,
  ): Promise<boolean> {
    try {
      // Get platform credentials
      const credentials = await this.getTeamCredentials(teamId);
      const platformCredential = credentials.find(
        (c: any) => c.platform === platform,
      );

      if (!platformCredential) {
        throw new Error(`No credentials found for platform: ${platform}`);
      }

      // Update on the platform
      const service = platformServiceFactory.createService(platform);

      service.setCredentials(platformCredential.credentials);

      const platformSuccess = await service.updateCampaignStatus(
        platformCampaignId,
        isActive,
      );

      if (!platformSuccess) {
        throw new Error("Failed to update status on platform");
      }

      // Update in database
      const dbSuccess = await this.updateCampaignSettings(campaignId, {
        is_active: isActive,
      });

      return dbSuccess;
    } catch (error) {
      Logger.error("Update campaign status error:", error as Error);

      return false;
    }
  }

  // Helper methods
  private async getTeamCredentials(teamId: string): Promise<any[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("platform_credentials")
      .select("*")
      .eq("team_id", teamId)
      .eq("is_active", true);

    if (error) {
      Logger.error("Error fetching team credentials:", error);

      return [];
    }

    return data || [];
  }

  private async syncCampaigns(
    teamId: string,
    platform: PlatformType,
    campaigns: PlatformCampaign[],
  ): Promise<DBCampaign[]> {
    const savedCampaigns: DBCampaign[] = [];
    const dbService = new PlatformDatabaseService();

    for (const campaign of campaigns) {
      const savedCampaign = await dbService.upsertCampaign({
        team_id: teamId,
        platform,
        platform_campaign_id: campaign.platform_campaign_id,
        name: campaign.name,
        status: campaign.status,
        budget: campaign.budget,
        is_active: campaign.is_active,
        raw_data: campaign.raw_data || {},
      });

      if (savedCampaign) {
        savedCampaigns.push(savedCampaign);
      }
    }

    return savedCampaigns;
  }

  private async saveCampaignMetrics(
    campaignId: string,
    metrics: CampaignMetrics[],
  ): Promise<void> {
    const dbService = new PlatformDatabaseService();

    for (const metric of metrics) {
      await dbService.upsertCampaignMetrics({
        campaign_id: campaignId,
        date: metric.date,
        impressions: metric.impressions,
        clicks: metric.clicks,
        conversions: metric.conversions,
        cost: metric.cost,
        revenue: metric.revenue,
      });
    }
  }

  private async updateCampaignSettings(
    campaignId: string,
    updates: { budget?: number; is_active?: boolean },
  ): Promise<boolean> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("campaigns")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", campaignId);

    if (error) {
      Logger.error("Error updating campaign settings:", error);

      return false;
    }

    return true;
  }
}
