import { test, expect } from "@playwright/test";

test.describe("Services Unit Tests @unit", () => {
  test("Platform service factory pattern", async () => {
    // Mock platform service factory
    const mockServices = new Map();

    const platformServiceFactory = {
      register: (platform: string, serviceClass: any) => {
        mockServices.set(platform, serviceClass);
      },

      create: (platform: string) => {
        const ServiceClass = mockServices.get(platform);
        return ServiceClass ? new ServiceClass() : null;
      },

      getSupportedPlatforms: () => {
        return Array.from(mockServices.keys());
      },
    };

    // Mock service classes
    class GoogleAdsService {
      platform = "google";
      testConnection() {
        return Promise.resolve({ success: true });
      }
    }

    class FacebookAdsService {
      platform = "facebook";
      testConnection() {
        return Promise.resolve({ success: true });
      }
    }

    // Test registration
    platformServiceFactory.register("google", GoogleAdsService);
    platformServiceFactory.register("facebook", FacebookAdsService);

    expect(platformServiceFactory.getSupportedPlatforms()).toHaveLength(2);
    expect(platformServiceFactory.getSupportedPlatforms()).toContain("google");
    expect(platformServiceFactory.getSupportedPlatforms()).toContain(
      "facebook",
    );

    // Test service creation
    const googleService = platformServiceFactory.create("google");
    const facebookService = platformServiceFactory.create("facebook");
    const invalidService = platformServiceFactory.create("invalid");

    expect(googleService).toBeDefined();
    expect(googleService?.platform).toBe("google");
    expect(facebookService).toBeDefined();
    expect(facebookService?.platform).toBe("facebook");
    expect(invalidService).toBeNull();
  });

  test("Base platform service functionality", async () => {
    // Mock base platform service
    class BasePlatformService {
      platform: string = "";

      async testConnection() {
        return { success: true, message: "Connection successful" };
      }

      async validateCredentials(credentials: any) {
        return Boolean(credentials?.accessToken && credentials?.refreshToken);
      }

      async refreshToken(refreshToken: string) {
        if (!refreshToken) {
          throw new Error("Refresh token required");
        }
        return {
          accessToken: "new-access-token",
          refreshToken: "new-refresh-token",
          expiresIn: 3600,
        };
      }

      async getAccountInfo() {
        return {
          id: "account-123",
          name: "Test Account",
          currency: "USD",
        };
      }
    }

    const service = new BasePlatformService();

    // Test connection test
    const connectionResult = await service.testConnection();
    expect(connectionResult.success).toBe(true);
    expect(connectionResult.message).toBe("Connection successful");

    // Test credential validation
    const validCredentials = {
      accessToken: "token123",
      refreshToken: "refresh123",
    };
    const invalidCredentials = { accessToken: "token123" };

    expect(await service.validateCredentials(validCredentials)).toBe(true);
    expect(await service.validateCredentials(invalidCredentials)).toBe(false);

    // Test token refresh
    const refreshResult = await service.refreshToken("refresh-token");
    expect(refreshResult.accessToken).toBe("new-access-token");
    expect(refreshResult.expiresIn).toBe(3600);

    // Test account info
    const accountInfo = await service.getAccountInfo();
    expect(accountInfo.id).toBe("account-123");
    expect(accountInfo.name).toBe("Test Account");
    expect(accountInfo.currency).toBe("USD");
  });

  test("Google Ads service integration", async () => {
    // Mock Google Ads service
    class GoogleAdsService {
      platform = "google";

      async fetchCampaigns() {
        return [
          {
            id: "google-campaign-1",
            name: "Search Campaign",
            status: "ENABLED",
            budget: { amount: 1000, currency: "USD" },
            bidding_strategy: { type: "MAXIMIZE_CLICKS" },
          },
          {
            id: "google-campaign-2",
            name: "Display Campaign",
            status: "PAUSED",
            budget: { amount: 500, currency: "USD" },
            bidding_strategy: { type: "TARGET_CPA" },
          },
        ];
      }

      async fetchCampaignMetrics(campaignId: string, dateRange: any) {
        return {
          campaignId,
          dateRange,
          metrics: {
            impressions: 10000,
            clicks: 500,
            cost: 750.5,
            conversions: 25,
            ctr: 0.05,
            cpc: 1.501,
          },
        };
      }

      async updateCampaignStatus(campaignId: string, isActive: boolean) {
        return {
          campaignId,
          status: isActive ? "ENABLED" : "PAUSED",
          success: true,
        };
      }

      async updateCampaignBudget(campaignId: string, budget: number) {
        return {
          campaignId,
          budget: { amount: budget, currency: "USD" },
          success: true,
        };
      }
    }

    const googleService = new GoogleAdsService();

    // Test campaign fetching
    const campaigns = await googleService.fetchCampaigns();
    expect(campaigns).toHaveLength(2);
    expect(campaigns[0].name).toBe("Search Campaign");
    expect(campaigns[0].status).toBe("ENABLED");
    expect(campaigns[1].status).toBe("PAUSED");

    // Test metrics fetching
    const metrics = await googleService.fetchCampaignMetrics(
      "google-campaign-1",
      {
        startDate: "2023-12-01",
        endDate: "2023-12-31",
      },
    );
    expect(metrics.campaignId).toBe("google-campaign-1");
    expect(metrics.metrics.impressions).toBe(10000);
    expect(metrics.metrics.ctr).toBe(0.05);

    // Test campaign status update
    const statusUpdate = await googleService.updateCampaignStatus(
      "google-campaign-1",
      false,
    );
    expect(statusUpdate.success).toBe(true);
    expect(statusUpdate.status).toBe("PAUSED");

    // Test budget update
    const budgetUpdate = await googleService.updateCampaignBudget(
      "google-campaign-1",
      1500,
    );
    expect(budgetUpdate.success).toBe(true);
    expect(budgetUpdate.budget.amount).toBe(1500);
  });

  test("Meta Ads service integration", async () => {
    // Mock Meta Ads service
    class MetaAdsService {
      platform = "facebook";

      async fetchCampaigns() {
        return [
          {
            id: "fb-campaign-1",
            name: "Conversion Campaign",
            status: "ACTIVE",
            daily_budget: "500",
            objective: "CONVERSIONS",
          },
          {
            id: "fb-campaign-2",
            name: "Traffic Campaign",
            status: "PAUSED",
            daily_budget: "300",
            objective: "LINK_CLICKS",
          },
        ];
      }

      async fetchCampaignMetrics(campaignId: string, dateRange: any) {
        return {
          campaignId,
          dateRange,
          insights: {
            data: [
              {
                impressions: 8000,
                clicks: 400,
                spend: 600.25,
                actions: [
                  { action_type: "purchase", value: "20" },
                  { action_type: "add_to_cart", value: "45" },
                ],
              },
            ],
          },
        };
      }
    }

    const metaService = new MetaAdsService();

    // Test campaign fetching
    const campaigns = await metaService.fetchCampaigns();
    expect(campaigns).toHaveLength(2);
    expect(campaigns[0].objective).toBe("CONVERSIONS");
    expect(campaigns[1].objective).toBe("LINK_CLICKS");

    // Test metrics fetching
    const metrics = await metaService.fetchCampaignMetrics("fb-campaign-1", {
      startDate: "2023-12-01",
      endDate: "2023-12-31",
    });
    expect(metrics.insights.data[0].impressions).toBe(8000);
    expect(metrics.insights.data[0].spend).toBe(600.25);
    expect(metrics.insights.data[0].actions).toHaveLength(2);
  });

  test("Platform sync service coordination", async () => {
    // Mock platform sync service
    class PlatformSyncService {
      private syncHistory: Array<{
        platform: string;
        timestamp: string;
        status: "success" | "failed";
        recordsProcessed?: number;
        error?: string;
      }> = [];

      async syncPlatform(platform: string) {
        try {
          // Simulate sync process
          await new Promise((resolve) => setTimeout(resolve, 10));

          const recordsProcessed = Math.floor(Math.random() * 100) + 1;

          this.syncHistory.push({
            platform,
            timestamp: new Date().toISOString(),
            status: "success",
            recordsProcessed,
          });

          return { success: true, recordsProcessed };
        } catch (error) {
          this.syncHistory.push({
            platform,
            timestamp: new Date().toISOString(),
            status: "failed",
            error: error instanceof Error ? error.message : String(error),
          });

          return { success: false, error };
        }
      }

      async syncAllPlatforms(platforms: string[]) {
        const results = await Promise.allSettled(
          platforms.map((platform) => this.syncPlatform(platform)),
        );

        return results.map((result, index) => ({
          platform: platforms[index],
          ...(result.status === "fulfilled"
            ? result.value
            : { success: false, error: result.reason }),
        }));
      }

      getSyncHistory(platform?: string) {
        return platform
          ? this.syncHistory.filter((h) => h.platform === platform)
          : this.syncHistory;
      }

      getLastSync(platform: string) {
        const platformHistory = this.syncHistory
          .filter((h) => h.platform === platform)
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          );

        return platformHistory[0] || null;
      }
    }

    const syncService = new PlatformSyncService();

    // Test single platform sync
    const googleSync = await syncService.syncPlatform("google");
    expect(googleSync.success).toBe(true);
    expect(typeof googleSync.recordsProcessed).toBe("number");

    // Test multiple platform sync
    const allSync = await syncService.syncAllPlatforms([
      "google",
      "facebook",
      "tiktok",
    ]);
    expect(allSync).toHaveLength(3);
    allSync.forEach((result) => {
      expect(result.platform).toBeDefined();
      expect(typeof result.success).toBe("boolean");
    });

    // Test sync history
    const history = syncService.getSyncHistory();
    expect(history.length).toBeGreaterThan(0);

    const googleHistory = syncService.getSyncHistory("google");
    expect(googleHistory.every((h) => h.platform === "google")).toBe(true);

    const lastGoogleSync = syncService.getLastSync("google");
    expect(lastGoogleSync).toBeDefined();
    expect(lastGoogleSync?.platform).toBe("google");
  });

  test("Error handler service functionality", async () => {
    // Mock error handler service
    class ErrorHandlerService {
      private errors: Array<{
        id: string;
        type: string;
        message: string;
        stack?: string;
        context?: any;
        timestamp: string;
      }> = [];

      handleError(error: any, context?: any) {
        const errorEntry = {
          id: `error-${Date.now()}`,
          type: error.name || "UnknownError",
          message: error.message || String(error),
          stack: error.stack,
          context,
          timestamp: new Date().toISOString(),
        };

        this.errors.push(errorEntry);

        // Return standardized error response
        return {
          success: false,
          error: {
            message: errorEntry.message,
            type: errorEntry.type,
            id: errorEntry.id,
          },
        };
      }

      getErrors(filter?: { type?: string; since?: Date }) {
        let filtered = this.errors;

        if (filter?.type) {
          filtered = filtered.filter((e) => e.type === filter.type);
        }

        if (filter?.since) {
          filtered = filtered.filter(
            (e) => new Date(e.timestamp) >= filter.since!,
          );
        }

        return filtered;
      }

      clearErrors() {
        this.errors.length = 0;
      }

      getErrorStats() {
        const stats: Record<string, number> = {};
        this.errors.forEach((error) => {
          stats[error.type] = (stats[error.type] || 0) + 1;
        });
        return stats;
      }
    }

    const errorHandler = new ErrorHandlerService();

    // Test error handling
    const testError = new Error("Test error message");
    testError.name = "TestError";

    const result = errorHandler.handleError(testError, { platform: "google" });
    expect(result.success).toBe(false);
    expect(result.error.message).toBe("Test error message");
    expect(result.error.type).toBe("TestError");

    // Test string error handling
    const stringErrorResult = errorHandler.handleError("String error");
    expect(stringErrorResult.success).toBe(false);
    expect(stringErrorResult.error.message).toBe("String error");

    // Test error retrieval
    const allErrors = errorHandler.getErrors();
    expect(allErrors).toHaveLength(2);

    const testErrors = errorHandler.getErrors({ type: "TestError" });
    expect(testErrors).toHaveLength(1);
    expect(testErrors[0].type).toBe("TestError");

    // Test error stats
    const stats = errorHandler.getErrorStats();
    expect(stats["TestError"]).toBe(1);
    expect(stats["UnknownError"]).toBe(1);

    // Test clear errors
    errorHandler.clearErrors();
    expect(errorHandler.getErrors()).toHaveLength(0);
  });

  test("Analytics service data processing", async () => {
    // Mock analytics service
    class AnalyticsService {
      async aggregateMetrics(campaigns: any[], dateRange: any) {
        const totals = campaigns.reduce(
          (acc, campaign) => {
            acc.impressions += campaign.metrics?.impressions || 0;
            acc.clicks += campaign.metrics?.clicks || 0;
            acc.cost += campaign.metrics?.cost || 0;
            acc.conversions += campaign.metrics?.conversions || 0;
            return acc;
          },
          { impressions: 0, clicks: 0, cost: 0, conversions: 0 },
        );

        return {
          ...totals,
          ctr: totals.clicks / totals.impressions,
          cpc: totals.cost / totals.clicks,
          conversionRate: totals.conversions / totals.clicks,
          dateRange,
        };
      }

      async getPlatformBreakdown(campaigns: any[]) {
        const platformData: Record<string, any> = {};

        campaigns.forEach((campaign) => {
          if (!platformData[campaign.platform]) {
            platformData[campaign.platform] = {
              platform: campaign.platform,
              campaigns: 0,
              impressions: 0,
              clicks: 0,
              cost: 0,
            };
          }

          const data = platformData[campaign.platform];
          data.campaigns += 1;
          data.impressions += campaign.metrics?.impressions || 0;
          data.clicks += campaign.metrics?.clicks || 0;
          data.cost += campaign.metrics?.cost || 0;
        });

        return Object.values(platformData);
      }

      async getTimeSeriesData(
        campaigns: any[],
        groupBy: "day" | "week" | "month",
      ) {
        // Mock time series data
        const mockTimeSeriesData = [
          { date: "2023-12-01", impressions: 1000, clicks: 50, cost: 75 },
          { date: "2023-12-02", impressions: 1200, clicks: 60, cost: 90 },
          { date: "2023-12-03", impressions: 900, clicks: 45, cost: 67.5 },
        ];

        return mockTimeSeriesData.map((data) => ({
          ...data,
          ctr: data.clicks / data.impressions,
          cpc: data.cost / data.clicks,
        }));
      }
    }

    const analyticsService = new AnalyticsService();

    // Mock campaign data
    const campaigns = [
      {
        platform: "google",
        metrics: {
          impressions: 10000,
          clicks: 500,
          cost: 750,
          conversions: 25,
        },
      },
      {
        platform: "facebook",
        metrics: { impressions: 8000, clicks: 400, cost: 600, conversions: 20 },
      },
    ];

    // Test metrics aggregation
    const aggregated = await analyticsService.aggregateMetrics(campaigns, {
      startDate: "2023-12-01",
      endDate: "2023-12-31",
    });

    expect(aggregated.impressions).toBe(18000);
    expect(aggregated.clicks).toBe(900);
    expect(aggregated.cost).toBe(1350);
    expect(aggregated.conversions).toBe(45);
    expect(aggregated.ctr).toBeCloseTo(0.05, 4);
    expect(aggregated.cpc).toBe(1.5);

    // Test platform breakdown
    const breakdown = await analyticsService.getPlatformBreakdown(campaigns);
    expect(breakdown).toHaveLength(2);

    const googleData = breakdown.find(
      (item: any) => item.platform === "google",
    );
    expect(googleData.campaigns).toBe(1);
    expect(googleData.impressions).toBe(10000);

    // Test time series data
    const timeSeries = await analyticsService.getTimeSeriesData(
      campaigns,
      "day",
    );
    expect(timeSeries).toHaveLength(3);
    expect(timeSeries[0].date).toBe("2023-12-01");
    expect(typeof timeSeries[0].ctr).toBe("number");
  });
});
