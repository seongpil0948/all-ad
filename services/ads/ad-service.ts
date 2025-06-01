import { trace } from "@opentelemetry/api";

import log from "@/utils/logger";

export interface IAdPlatformAdapter {
  fetchCampaigns(accountId: string): Promise<Campaign[]>;
  fetchAdPerformance(
    campaignId: string,
    dateRange: DateRange
  ): Promise<AdPerformance>;
  createCampaign(campaign: CreateCampaignDto): Promise<Campaign>;
}

// Domain Models
export interface Campaign {
  id: string;
  name: string;
  status: "active" | "paused" | "completed";
  budget: number;
  startDate: Date;
  endDate?: Date;
  platform: string;
}

export interface AdPerformance {
  campaignId: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  ctr: number;
  cpc: number;
  dateRange: DateRange;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface CreateCampaignDto {
  name: string;
  budget: number;
  startDate: Date;
  endDate?: Date;
  targeting?: Record<string, any>;
}

// Ad Service Implementation (Hexagonal Architecture - Application Service)
export class AdService {
  private adapters: Map<string, IAdPlatformAdapter> = new Map();

  constructor() {
    log.info("AdService initialized", {
      module: "AdService",
      availableAdapters: Array.from(this.adapters.keys()),
    });
  }

  // Register adapter for dependency injection
  registerAdapter(platform: string, adapter: IAdPlatformAdapter): void {
    this.adapters.set(platform, adapter);
    log.info("Ad platform adapter registered", {
      module: "AdService",
      platform,
    });
  }

  // Fetch campaigns from multiple platforms
  async fetchAllCampaigns(accountId: string): Promise<Campaign[]> {
    return log.span("AdService.fetchAllCampaigns", async () => {
      const platforms = Array.from(this.adapters.keys());

      log.info("Fetching campaigns from all platforms", {
        module: "AdService",
        method: "fetchAllCampaigns",
        accountId,
        platforms,
      });

      try {
        const campaignPromises = platforms.map((platform) =>
          this.fetchCampaignsByPlatform(platform, accountId)
        );

        const results = await Promise.allSettled(campaignPromises);
        const allCampaigns: Campaign[] = [];

        results.forEach((result, index) => {
          if (result.status === "fulfilled") {
            allCampaigns.push(...result.value);
          } else {
            log.error(
              `Failed to fetch campaigns from ${platforms[index]}`,
              result.reason,
              {
                module: "AdService",
                method: "fetchAllCampaigns",
                platform: platforms[index],
                accountId,
              }
            );
          }
        });

        log.info("Successfully fetched campaigns", {
          module: "AdService",
          method: "fetchAllCampaigns",
          totalCampaigns: allCampaigns.length,
          platformBreakdown: this.getCampaignCountByPlatform(allCampaigns),
        });

        return allCampaigns;
      } catch (error) {
        log.error("Failed to fetch all campaigns", error as Error, {
          module: "AdService",
          method: "fetchAllCampaigns",
          accountId,
        });
        throw error;
      }
    });
  }

  // Fetch campaigns from specific platform
  private async fetchCampaignsByPlatform(
    platform: string,
    accountId: string
  ): Promise<Campaign[]> {
    const adapter = this.adapters.get(platform);

    if (!adapter) {
      log.warn("No adapter found for platform", {
        module: "AdService",
        method: "fetchCampaignsByPlatform",
        platform,
        availableAdapters: Array.from(this.adapters.keys()),
      });

      return [];
    }

    const tracer = trace.getTracer("all-ad-platform");

    return tracer.startActiveSpan(
      `fetch-campaigns-${platform}`,
      async (span) => {
        const startTime = Date.now();

        try {
          span.setAttributes({
            "ad.platform": platform,
            "ad.account_id": accountId,
          });

          const campaigns = await adapter.fetchCampaigns(accountId);
          const duration = Date.now() - startTime;

          log.perf(`Fetch campaigns from ${platform}`, duration, {
            module: "AdService",
            platform,
            campaignCount: campaigns.length,
          });

          span.setAttributes({
            "ad.campaign_count": campaigns.length,
            "ad.duration_ms": duration,
          });

          span.end();

          return campaigns;
        } catch (error) {
          span.recordException(error as Error);
          span.end();
          throw error;
        }
      }
    );
  }

  // Get aggregated performance data
  async getAggregatedPerformance(
    campaignIds: string[],
    dateRange: DateRange
  ): Promise<AdPerformance[]> {
    return log.span("AdService.getAggregatedPerformance", async () => {
      log.info("Fetching aggregated performance data", {
        module: "AdService",
        method: "getAggregatedPerformance",
        campaignCount: campaignIds.length,
        dateRange: {
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString(),
        },
      });

      const performanceData: AdPerformance[] = [];

      // Group campaigns by platform for efficient fetching
      const campaignsByPlatform = this.groupCampaignsByPlatform(campaignIds);

      for (const [platform, ids] of Array.from(campaignsByPlatform.entries())) {
        const adapter = this.adapters.get(platform);

        if (!adapter) {
          log.warn("No adapter for platform when fetching performance", {
            module: "AdService",
            method: "getAggregatedPerformance",
            platform,
          });
          continue;
        }

        try {
          const platformPerformance = await Promise.all(
            ids.map((id) => adapter.fetchAdPerformance(id, dateRange))
          );

          performanceData.push(...platformPerformance);
        } catch (error) {
          log.error(
            `Failed to fetch performance from ${platform}`,
            error as Error,
            {
              module: "AdService",
              method: "getAggregatedPerformance",
              platform,
              campaignIds: ids,
            }
          );
        }
      }

      const totalMetrics = this.calculateTotalMetrics(performanceData);

      log.info("Aggregated performance data fetched", {
        module: "AdService",
        method: "getAggregatedPerformance",
        totalCampaigns: performanceData.length,
        totalMetrics,
      });

      return performanceData;
    });
  }

  // Helper methods
  private getCampaignCountByPlatform(
    campaigns: Campaign[]
  ): Record<string, number> {
    return campaigns.reduce(
      (acc, campaign) => {
        acc[campaign.platform] = (acc[campaign.platform] || 0) + 1;

        return acc;
      },
      {} as Record<string, number>
    );
  }

  private groupCampaignsByPlatform(
    campaignIds: string[]
  ): Map<string, string[]> {
    // This is a simplified implementation
    // In real scenario, you would look up the platform for each campaign ID
    const grouped = new Map<string, string[]>();

    // For demo purposes, assuming campaign IDs have platform prefix
    campaignIds.forEach((id) => {
      const platform = id.split("_")[0]; // e.g., "google_123" -> "google"

      if (!grouped.has(platform)) {
        grouped.set(platform, []);
      }
      grouped.get(platform)!.push(id);
    });

    return grouped;
  }

  private calculateTotalMetrics(performanceData: AdPerformance[]): {
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    totalSpend: number;
    averageCtr: number;
    averageCpc: number;
  } {
    const totals = performanceData.reduce(
      (acc, data) => ({
        totalImpressions: acc.totalImpressions + data.impressions,
        totalClicks: acc.totalClicks + data.clicks,
        totalConversions: acc.totalConversions + data.conversions,
        totalSpend: acc.totalSpend + data.spend,
      }),
      {
        totalImpressions: 0,
        totalClicks: 0,
        totalConversions: 0,
        totalSpend: 0,
      }
    );

    return {
      ...totals,
      averageCtr: totals.totalClicks / totals.totalImpressions || 0,
      averageCpc: totals.totalSpend / totals.totalClicks || 0,
    };
  }
}

// Singleton instance with dependency injection
let adServiceInstance: AdService | null = null;

export function getAdService(): AdService {
  if (!adServiceInstance) {
    adServiceInstance = new AdService();
  }

  return adServiceInstance;
}
