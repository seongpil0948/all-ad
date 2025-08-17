import "server-only";

import { PlatformType } from "@/types";
import {
  getPlatformCredentials,
  updateLastSync,
  markCredentialFailed,
  isCredentialExpired,
  needsRefresh,
} from "@/lib/auth/platform-auth";
import { tokenRefreshService } from "@/lib/auth/token-refresh-service";
import { createClient } from "@/utils/supabase/server";
import log from "@/utils/logger";

// Platform-specific sync interfaces
export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  errors: string[];
  lastSyncAt: string;
}

export interface CampaignData {
  platformCampaignId: string;
  name: string;
  status: "ENABLED" | "PAUSED" | "REMOVED";
  budget: number;
  startDate: string;
  endDate?: string;
  metrics: {
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
    revenue: number;
  };
}

export interface PlatformApiClient {
  getCampaigns(): Promise<CampaignData[]>;
  getMetrics(
    campaignIds: string[],
    dateRange: { start: Date; end: Date },
  ): Promise<
    {
      campaignId: string;
      date: string;
      impressions: number;
      clicks: number;
      cost: number;
      conversions: number;
      revenue: number;
    }[]
  >;
  updateCampaignStatus(
    campaignId: string,
    status: "ENABLED" | "PAUSED",
  ): Promise<void>;
}

// Base platform sync service
abstract class BasePlatformSyncService {
  protected abstract platform: PlatformType;

  abstract createApiClient(
    accessToken: string,
    accountId: string,
  ): PlatformApiClient;

  async syncPlatformData(
    teamId: string,
    credentialId: string,
    options: {
      syncCampaigns?: boolean;
      syncMetrics?: boolean;
      dateRange?: { start: Date; end: Date };
    } = {},
  ): Promise<SyncResult> {
    const { syncCampaigns = true, syncMetrics = true } = options;
    const startTime = new Date().toISOString();
    let recordsProcessed = 0;
    const errors: string[] = [];

    try {
      // Get platform credential
      const credentials = await getPlatformCredentials(teamId, this.platform);
      const credential = credentials.find((c) => c.id === credentialId);

      if (!credential) {
        throw new Error(`Credential not found: ${credentialId}`);
      }

      // Check if credential is expired
      if (isCredentialExpired(credential)) {
        throw new Error("Access token expired. Please refresh or reconnect.");
      }

      // Check if refresh is needed
      if (needsRefresh(credential)) {
        log.info("Credential needs refresh, attempting refresh", {
          credentialId,
          platform: this.platform,
        });

        const refreshResult =
          await tokenRefreshService.refreshPlatformCredentials(
            teamId,
            this.platform,
          );

        if (refreshResult.failed > 0) {
          throw new Error("Failed to refresh access token");
        }
      }

      // Create API client
      const apiClient = this.createApiClient(
        credential.access_token,
        credential.account_id,
      );

      // Sync campaigns
      if (syncCampaigns) {
        try {
          const campaigns = await apiClient.getCampaigns();

          await this.storeCampaigns(teamId, credentialId, campaigns);
          recordsProcessed += campaigns.length;

          log.info("Campaigns synced successfully", {
            platform: this.platform,
            credentialId,
            count: campaigns.length,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          const errorMsg = `Campaign sync failed: ${errorMessage}`;

          errors.push(errorMsg);
          log.error(errorMsg, {
            platform: this.platform,
            credentialId,
            error: errorMessage,
          });
        }
      }

      // Sync metrics
      if (syncMetrics && recordsProcessed > 0) {
        try {
          const dateRange = options.dateRange || {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            end: new Date(),
          };

          // Get campaign IDs to fetch metrics for
          const supabase = await createClient();
          const { data: campaigns } = await supabase
            .from("campaigns")
            .select("platform_campaign_id")
            .eq("team_id", teamId)
            .eq("platform", this.platform)
            .eq("credential_id", credentialId);

          if (campaigns && campaigns.length > 0) {
            const campaignIds = campaigns.map((c) => c.platform_campaign_id);
            const metrics = await apiClient.getMetrics(campaignIds, dateRange);

            await this.storeMetrics(teamId, credentialId, metrics);

            log.info("Metrics synced successfully", {
              platform: this.platform,
              credentialId,
              metricsCount: metrics.length,
            });
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          const errorMsg = `Metrics sync failed: ${errorMessage}`;

          errors.push(errorMsg);
          log.error(errorMsg, {
            platform: this.platform,
            credentialId,
            error: errorMessage,
          });
        }
      }

      // Update last sync time
      await updateLastSync(credentialId);

      return {
        success: errors.length === 0,
        recordsProcessed,
        errors,
        lastSyncAt: startTime,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Sync failed";

      await markCredentialFailed(credentialId, errorMsg);

      log.error("Platform sync failed", {
        platform: this.platform,
        credentialId,
        error: errorMsg,
      });

      return {
        success: false,
        recordsProcessed,
        errors: [errorMsg, ...errors],
        lastSyncAt: startTime,
      };
    }
  }

  private async storeCampaigns(
    teamId: string,
    credentialId: string,
    campaigns: CampaignData[],
  ): Promise<void> {
    const supabase = await createClient();

    // Prepare campaign data for insertion
    const campaignInserts = campaigns.map((campaign) => ({
      team_id: teamId,
      credential_id: credentialId,
      platform: this.platform,
      platform_campaign_id: campaign.platformCampaignId,
      name: campaign.name,
      status: campaign.status,
      budget: campaign.budget,
      start_date: campaign.startDate,
      end_date: campaign.endDate,
      // Store current metrics
      impressions: campaign.metrics.impressions,
      clicks: campaign.metrics.clicks,
      cost: campaign.metrics.cost,
      conversions: campaign.metrics.conversions,
      revenue: campaign.metrics.revenue,
      updated_at: new Date().toISOString(),
    }));

    // Upsert campaigns (insert or update if exists)
    const { error } = await supabase.from("campaigns").upsert(campaignInserts, {
      onConflict: "team_id,platform,platform_campaign_id",
    });

    if (error) {
      throw new Error(`Failed to store campaigns: ${error.message}`);
    }
  }

  private async storeMetrics(
    teamId: string,
    credentialId: string,
    metrics: {
      campaignId: string;
      date: string;
      impressions: number;
      clicks: number;
      cost: number;
      conversions: number;
      revenue: number;
    }[],
  ): Promise<void> {
    const supabase = await createClient();

    // Prepare metrics data for insertion
    const metricsInserts = metrics.map((metric) => ({
      campaign_id: metric.campaignId,
      date: metric.date,
      impressions: metric.impressions || 0,
      clicks: metric.clicks || 0,
      cost: metric.cost || 0,
      conversions: metric.conversions || 0,
      revenue: metric.revenue || 0,
      created_at: new Date().toISOString(),
    }));

    // Insert metrics data
    const { error } = await supabase
      .from("campaign_metrics")
      .upsert(metricsInserts, {
        onConflict: "campaign_id,date",
      });

    if (error) {
      throw new Error(`Failed to store metrics: ${error.message}`);
    }
  }
}

// Google Ads sync service
class GoogleAdsSyncService extends BasePlatformSyncService {
  protected platform: PlatformType = "google";

  createApiClient(accessToken: string, accountId: string): PlatformApiClient {
    return {
      async getCampaigns(): Promise<CampaignData[]> {
        // Mock implementation - replace with actual Google Ads API calls
        const response = await fetch(
          `https://googleads.googleapis.com/v14/customers/${accountId}/campaigns`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "developer-token": process.env.GOOGLE_DEVELOPER_TOKEN!,
            },
          },
        );

        if (!response.ok) {
          throw new Error(`Google Ads API error: ${response.status}`);
        }

        const data = await response.json();

        // Transform Google Ads data to our format
        return (
          data.results?.map(
            (campaign: {
              campaign: {
                id: string;
                name: string;
                status: string;
                campaignBudget?: { amountMicros: number };
                startDate: string;
                endDate?: string;
              };
              metrics?: {
                impressions: number;
                clicks: number;
                costMicros: number;
                conversions: number;
                revenue: number;
              };
            }) => ({
              platformCampaignId: campaign.campaign.id,
              name: campaign.campaign.name,
              status: campaign.campaign.status,
              budget:
                (campaign.campaign.campaignBudget?.amountMicros ?? 0) / 1000000,
              startDate: campaign.campaign.startDate,
              endDate: campaign.campaign.endDate,
              metrics: {
                impressions: campaign.metrics?.impressions || 0,
                clicks: campaign.metrics?.clicks || 0,
                cost: (campaign.metrics?.costMicros ?? 0) / 1000000,
                conversions: campaign.metrics?.conversions || 0,
                revenue: campaign.metrics?.revenue || 0,
              },
            }),
          ) || []
        );
      },

      async getMetrics(campaignIds: string[]): Promise<
        {
          campaignId: string;
          date: string;
          impressions: number;
          clicks: number;
          cost: number;
          conversions: number;
          revenue: number;
        }[]
      > {
        // Mock implementation - replace with actual Google Ads API calls
        return campaignIds.map((id) => ({
          campaignId: id,
          date: new Date().toISOString().split("T")[0],
          impressions: Math.floor(Math.random() * 10000),
          clicks: Math.floor(Math.random() * 1000),
          cost: Math.floor(Math.random() * 100000),
          conversions: Math.floor(Math.random() * 100),
          revenue: Math.floor(Math.random() * 500000),
        }));
      },

      async updateCampaignStatus(
        campaignId: string,
        status: "ENABLED" | "PAUSED",
      ): Promise<void> {
        // Mock implementation - replace with actual Google Ads API calls
        const response = await fetch(
          `https://googleads.googleapis.com/v14/customers/${accountId}/campaigns/${campaignId}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "developer-token": process.env.GOOGLE_DEVELOPER_TOKEN!,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              campaign: {
                resourceName: `customers/${accountId}/campaigns/${campaignId}`,
                status,
              },
              updateMask: {
                paths: ["status"],
              },
            }),
          },
        );

        if (!response.ok) {
          throw new Error(
            `Failed to update campaign status: ${response.status}`,
          );
        }
      },
    };
  }
}

// Meta Ads sync service
class MetaAdsSyncService extends BasePlatformSyncService {
  protected platform: PlatformType = "facebook";

  createApiClient(accessToken: string, accountId: string): PlatformApiClient {
    return {
      async getCampaigns(): Promise<CampaignData[]> {
        // Mock implementation - replace with actual Meta API calls
        const response = await fetch(
          `https://graph.facebook.com/v18.0/${accountId}/campaigns`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error(`Meta API error: ${response.status}`);
        }

        const data = await response.json();

        // Transform Meta data to our format
        return (
          data.data?.map(
            (campaign: {
              id: string;
              name: string;
              status: string;
              daily_budget?: number;
              start_time?: string;
              stop_time?: string;
            }) => ({
              platformCampaignId: campaign.id,
              name: campaign.name,
              status: campaign.status,
              budget: campaign.daily_budget || 0,
              startDate: campaign.start_time,
              endDate: campaign.stop_time,
              metrics: {
                impressions: 0, // Will be fetched separately
                clicks: 0,
                cost: 0,
                conversions: 0,
                revenue: 0,
              },
            }),
          ) || []
        );
      },

      async getMetrics(campaignIds: string[]): Promise<
        {
          campaignId: string;
          date: string;
          impressions: number;
          clicks: number;
          cost: number;
          conversions: number;
          revenue: number;
        }[]
      > {
        // Mock implementation - replace with actual Meta API calls
        return campaignIds.map((id) => ({
          campaignId: id,
          date: new Date().toISOString().split("T")[0],
          impressions: Math.floor(Math.random() * 8000),
          clicks: Math.floor(Math.random() * 800),
          cost: Math.floor(Math.random() * 80000),
          conversions: Math.floor(Math.random() * 80),
          revenue: Math.floor(Math.random() * 400000),
        }));
      },

      async updateCampaignStatus(
        campaignId: string,
        status: "ENABLED" | "PAUSED",
      ): Promise<void> {
        // Mock implementation - replace with actual Meta API calls
        const metaStatus = status === "ENABLED" ? "ACTIVE" : "PAUSED";

        const response = await fetch(
          `https://graph.facebook.com/v18.0/${campaignId}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            body: new URLSearchParams({
              status: metaStatus,
            }),
          },
        );

        if (!response.ok) {
          throw new Error(
            `Failed to update campaign status: ${response.status}`,
          );
        }
      },
    };
  }
}

// Platform sync service factory
export class PlatformSyncServiceFactory {
  private static services: Map<PlatformType, BasePlatformSyncService> =
    new Map();

  static getService(platform: PlatformType): BasePlatformSyncService {
    if (!this.services.has(platform)) {
      switch (platform) {
        case "google":
          this.services.set(platform, new GoogleAdsSyncService());
          break;
        case "facebook":
          this.services.set(platform, new MetaAdsSyncService());
          break;
        default:
          throw new Error(
            `Sync service not implemented for platform: ${platform}`,
          );
      }
    }

    return this.services.get(platform)!;
  }

  static async syncAllPlatforms(
    teamId: string,
    options?: {
      platforms?: PlatformType[];
      syncCampaigns?: boolean;
      syncMetrics?: boolean;
      dateRange?: { start: Date; end: Date };
    },
  ): Promise<Record<string, SyncResult>> {
    const { platforms, ...syncOptions } = options || {};

    // Get all active credentials for the team
    const credentials = await getPlatformCredentials(teamId);

    // Filter by platforms if specified
    const credentialsToSync = platforms
      ? credentials.filter((c) => platforms.includes(c.platform))
      : credentials;

    const results: Record<string, SyncResult> = {};

    // Sync each platform in parallel
    await Promise.allSettled(
      credentialsToSync.map(async (credential) => {
        try {
          const service = this.getService(credential.platform);
          const result = await service.syncPlatformData(
            teamId,
            credential.id,
            syncOptions,
          );

          results[`${credential.platform}-${credential.account_id}`] = result;
        } catch (error) {
          results[`${credential.platform}-${credential.account_id}`] = {
            success: false,
            recordsProcessed: 0,
            errors: [error instanceof Error ? error.message : "Unknown error"],
            lastSyncAt: new Date().toISOString(),
          };
        }
      }),
    );

    return results;
  }
}

// Export individual services for testing
export const googleAdsSyncService = new GoogleAdsSyncService();
export const metaAdsSyncService = new MetaAdsSyncService();
