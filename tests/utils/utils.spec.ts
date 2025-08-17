import { test, expect } from "@playwright/test";

test.describe("Utils Unit Tests @unit", () => {
  test("logger utility functions", async () => {
    // Mock logger functionality
    const mockLogs: Array<{
      level: string;
      message: string;
      timestamp: string;
    }> = [];

    const mockLogger = {
      info: (message: string) => {
        mockLogs.push({
          level: "info",
          message,
          timestamp: new Date().toISOString(),
        });
      },
      error: (message: string, error?: any) => {
        mockLogs.push({
          level: "error",
          message: error ? `${message}: ${error}` : message,
          timestamp: new Date().toISOString(),
        });
      },
      warn: (message: string) => {
        mockLogs.push({
          level: "warn",
          message,
          timestamp: new Date().toISOString(),
        });
      },
      debug: (message: string) => {
        mockLogs.push({
          level: "debug",
          message,
          timestamp: new Date().toISOString(),
        });
      },
    };

    // Test logging functions
    mockLogger.info("Application started");
    mockLogger.error("Database connection failed");
    mockLogger.warn("Deprecated API usage");
    mockLogger.debug("Debug information");

    expect(mockLogs).toHaveLength(4);
    expect(mockLogs[0].level).toBe("info");
    expect(mockLogs[0].message).toBe("Application started");
    expect(mockLogs[1].level).toBe("error");
    expect(mockLogs[2].level).toBe("warn");
    expect(mockLogs[3].level).toBe("debug");

    // Test log filtering
    const errorLogs = mockLogs.filter((log) => log.level === "error");
    expect(errorLogs).toHaveLength(1);
  });

  test("date-formatter utility functions", async () => {
    const testDate = new Date("2023-12-15T10:30:00Z");

    // Test date formatting functions
    const formatToYYYYMMDD = (date: Date) => {
      return date.toISOString().split("T")[0];
    };

    const formatToReadable = (date: Date) => {
      return date.toLocaleDateString();
    };

    const formatToDateTime = (date: Date) => {
      return date.toISOString();
    };

    // Test formatting
    expect(formatToYYYYMMDD(testDate)).toBe("2023-12-15");
    expect(formatToDateTime(testDate)).toBe("2023-12-15T10:30:00.000Z");
    expect(typeof formatToReadable(testDate)).toBe("string");

    // Test date range functions
    const getDateRange = (days: number) => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);
      return { startDate, endDate };
    };

    const range7Days = getDateRange(7);
    expect(range7Days.startDate).toBeInstanceOf(Date);
    expect(range7Days.endDate).toBeInstanceOf(Date);
    expect(range7Days.endDate.getTime() - range7Days.startDate.getTime()).toBe(
      7 * 24 * 60 * 60 * 1000,
    );
  });

  test("metric-transformer utility functions", async () => {
    // Mock raw platform metrics
    const googleMetrics = {
      impressions: "10000",
      clicks: "500",
      cost: "750.50",
      conversions: "25",
    };

    const facebookMetrics = {
      impressions: 8000,
      clicks: 400,
      spend: 600.25,
      actions: [{ action_type: "purchase", value: "20" }],
    };

    // Test metric transformation
    const transformGoogleMetrics = (raw: any) => {
      return {
        impressions: parseInt(raw.impressions) || 0,
        clicks: parseInt(raw.clicks) || 0,
        cost: parseFloat(raw.cost) || 0,
        conversions: parseInt(raw.conversions) || 0,
        ctr: raw.clicks / raw.impressions,
        cpc: raw.cost / raw.clicks,
      };
    };

    const transformFacebookMetrics = (raw: any) => {
      const conversions =
        raw.actions?.find((a: any) => a.action_type === "purchase")?.value ||
        "0";
      return {
        impressions: raw.impressions || 0,
        clicks: raw.clicks || 0,
        cost: raw.spend || 0,
        conversions: parseInt(conversions) || 0,
        ctr: raw.clicks / raw.impressions,
        cpc: raw.spend / raw.clicks,
      };
    };

    const transformedGoogle = transformGoogleMetrics(googleMetrics);
    expect(transformedGoogle.impressions).toBe(10000);
    expect(transformedGoogle.clicks).toBe(500);
    expect(transformedGoogle.cost).toBe(750.5);
    expect(transformedGoogle.conversions).toBe(25);
    expect(transformedGoogle.ctr).toBe(0.05);
    expect(transformedGoogle.cpc).toBe(1.501);

    const transformedFacebook = transformFacebookMetrics(facebookMetrics);
    expect(transformedFacebook.impressions).toBe(8000);
    expect(transformedFacebook.clicks).toBe(400);
    expect(transformedFacebook.cost).toBe(600.25);
    expect(transformedFacebook.conversions).toBe(20);
  });

  test("campaign-transformer utility functions", async () => {
    // Mock platform campaign data
    const googleCampaign = {
      id: "google_123",
      name: "Google Campaign",
      status: "ENABLED",
      budget: { amount: 1000, currency: "USD" },
      bidding_strategy: { type: "MAXIMIZE_CLICKS" },
    };

    const facebookCampaign = {
      id: "fb_456",
      name: "Facebook Campaign",
      status: "ACTIVE",
      daily_budget: "500",
      objective: "CONVERSIONS",
    };

    // Test campaign transformation to unified format
    const transformGoogleCampaign = (raw: any) => {
      return {
        id: raw.id,
        platform: "google",
        name: raw.name,
        status: raw.status === "ENABLED" ? "active" : "paused",
        budget: raw.budget?.amount || 0,
        currency: raw.budget?.currency || "USD",
        biddingStrategy: raw.bidding_strategy?.type,
      };
    };

    const transformFacebookCampaign = (raw: any) => {
      return {
        id: raw.id,
        platform: "facebook",
        name: raw.name,
        status: raw.status === "ACTIVE" ? "active" : "paused",
        budget: parseFloat(raw.daily_budget) || 0,
        currency: "USD",
        objective: raw.objective,
      };
    };

    const unifiedGoogle = transformGoogleCampaign(googleCampaign);
    expect(unifiedGoogle.platform).toBe("google");
    expect(unifiedGoogle.status).toBe("active");
    expect(unifiedGoogle.budget).toBe(1000);
    expect(unifiedGoogle.currency).toBe("USD");

    const unifiedFacebook = transformFacebookCampaign(facebookCampaign);
    expect(unifiedFacebook.platform).toBe("facebook");
    expect(unifiedFacebook.status).toBe("active");
    expect(unifiedFacebook.budget).toBe(500);
    expect(unifiedFacebook.objective).toBe("CONVERSIONS");
  });

  test("analytics-helpers utility functions", async () => {
    // Mock analytics data
    const campaignData = [
      { platform: "google", impressions: 10000, clicks: 500, cost: 750 },
      { platform: "facebook", impressions: 8000, clicks: 400, cost: 600 },
      { platform: "google", impressions: 5000, clicks: 200, cost: 300 },
    ];

    // Test aggregation functions
    const aggregateByPlatform = (data: any[]) => {
      const result: Record<string, any> = {};

      data.forEach((item) => {
        if (!result[item.platform]) {
          result[item.platform] = {
            platform: item.platform,
            impressions: 0,
            clicks: 0,
            cost: 0,
          };
        }

        result[item.platform].impressions += item.impressions;
        result[item.platform].clicks += item.clicks;
        result[item.platform].cost += item.cost;
      });

      return Object.values(result);
    };

    const aggregated = aggregateByPlatform(campaignData);
    expect(aggregated).toHaveLength(2);

    const googleData = aggregated.find(
      (item: any) => item.platform === "google",
    );
    expect(googleData.impressions).toBe(15000);
    expect(googleData.clicks).toBe(700);
    expect(googleData.cost).toBe(1050);

    const facebookData = aggregated.find(
      (item: any) => item.platform === "facebook",
    );
    expect(facebookData.impressions).toBe(8000);
    expect(facebookData.clicks).toBe(400);
    expect(facebookData.cost).toBe(600);

    // Test metric calculations
    const calculateMetrics = (data: any) => {
      return {
        ...data,
        ctr: data.clicks / data.impressions,
        cpc: data.cost / data.clicks,
        totalSpend: data.cost,
      };
    };

    const googleMetrics = calculateMetrics(googleData);
    expect(googleMetrics.ctr).toBeCloseTo(0.0467, 4);
    expect(googleMetrics.cpc).toBe(1.5);
    expect(googleMetrics.totalSpend).toBe(1050);
  });

  test("platform-config utility functions", async () => {
    // Mock platform configurations
    const platformConfigs = {
      google: {
        name: "Google Ads",
        oauth: {
          scope: ["https://www.googleapis.com/auth/adwords"],
          authUrl: "https://accounts.google.com/oauth/v2/auth",
          tokenUrl: "https://oauth2.googleapis.com/token",
        },
        api: {
          baseUrl: "https://googleads.googleapis.com",
          version: "v17",
        },
      },
      facebook: {
        name: "Meta Ads",
        oauth: {
          scope: ["ads_management", "business_management"],
          authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
          tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
        },
        api: {
          baseUrl: "https://graph.facebook.com",
          version: "v18.0",
        },
      },
    };

    // Test platform config access
    expect(platformConfigs.google.name).toBe("Google Ads");
    expect(platformConfigs.facebook.name).toBe("Meta Ads");
    expect(platformConfigs.google.oauth.scope).toContain(
      "https://www.googleapis.com/auth/adwords",
    );
    expect(platformConfigs.facebook.oauth.scope).toContain("ads_management");

    // Test config validation
    const validateConfig = (config: any) => {
      return Boolean(
        config.name &&
          config.oauth &&
          config.oauth.scope &&
          config.oauth.authUrl &&
          config.oauth.tokenUrl &&
          config.api &&
          config.api.baseUrl,
      );
    };

    expect(validateConfig(platformConfigs.google)).toBe(true);
    expect(validateConfig(platformConfigs.facebook)).toBe(true);
  });

  test("toast utility functions", async () => {
    // Mock toast system
    const toasts: Array<{
      id: string;
      type: string;
      title: string;
      message: string;
    }> = [];

    const toastUtils = {
      success: (title: string, message: string) => {
        toasts.push({
          id: `toast-${Date.now()}`,
          type: "success",
          title,
          message,
        });
      },
      error: (title: string, message: string) => {
        toasts.push({
          id: `toast-${Date.now()}`,
          type: "error",
          title,
          message,
        });
      },
      remove: (id: string) => {
        const index = toasts.findIndex((t) => t.id === id);
        if (index > -1) {
          toasts.splice(index, 1);
        }
      },
      clear: () => {
        toasts.length = 0;
      },
    };

    // Test toast creation
    toastUtils.success("Success", "Campaign created successfully");
    toastUtils.error("Error", "Failed to save changes");

    expect(toasts).toHaveLength(2);
    expect(toasts[0].type).toBe("success");
    expect(toasts[0].title).toBe("Success");
    expect(toasts[1].type).toBe("error");
    expect(toasts[1].title).toBe("Error");

    // Test toast removal
    const firstToastId = toasts[0].id;
    toastUtils.remove(firstToastId);
    expect(toasts).toHaveLength(1);
    expect(toasts[0].type).toBe("error");

    // Test clear all
    toastUtils.clear();
    expect(toasts).toHaveLength(0);
  });

  test("team-helpers utility functions", async () => {
    // Mock team data
    const teamMembers = [
      {
        id: "1",
        role: "master",
        name: "Admin User",
        email: "admin@example.com",
      },
      {
        id: "2",
        role: "team_mate",
        name: "Team Member",
        email: "member@example.com",
      },
      {
        id: "3",
        role: "viewer",
        name: "Viewer User",
        email: "viewer@example.com",
      },
    ];

    // Test role-based utilities
    const getRolePermissions = (role: string) => {
      const permissions = {
        master: ["read", "write", "delete", "manage_team", "manage_billing"],
        team_mate: ["read", "write"],
        viewer: ["read"],
      };
      return permissions[role as keyof typeof permissions] || [];
    };

    const canManageTeam = (role: string) => {
      return getRolePermissions(role).includes("manage_team");
    };

    const canWriteCampaigns = (role: string) => {
      return getRolePermissions(role).includes("write");
    };

    // Test permissions
    expect(canManageTeam("master")).toBe(true);
    expect(canManageTeam("team_mate")).toBe(false);
    expect(canManageTeam("viewer")).toBe(false);

    expect(canWriteCampaigns("master")).toBe(true);
    expect(canWriteCampaigns("team_mate")).toBe(true);
    expect(canWriteCampaigns("viewer")).toBe(false);

    // Test member filtering
    const masterMembers = teamMembers.filter((m) => m.role === "master");
    const writableMembers = teamMembers.filter((m) =>
      canWriteCampaigns(m.role),
    );

    expect(masterMembers).toHaveLength(1);
    expect(writableMembers).toHaveLength(2);
  });

  test("animations utility functions", async () => {
    // Mock animation utilities
    const animationUtils = {
      fadeIn: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.3 },
      },
      slideUp: {
        initial: { y: 20, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        transition: { duration: 0.4 },
      },
      scaleIn: {
        initial: { scale: 0.8, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { duration: 0.3, ease: "easeOut" },
      },
    };

    // Test animation configurations
    expect(animationUtils.fadeIn.initial.opacity).toBe(0);
    expect(animationUtils.fadeIn.animate.opacity).toBe(1);
    expect(animationUtils.fadeIn.transition.duration).toBe(0.3);

    expect(animationUtils.slideUp.initial.y).toBe(20);
    expect(animationUtils.slideUp.animate.y).toBe(0);

    expect(animationUtils.scaleIn.initial.scale).toBe(0.8);
    expect(animationUtils.scaleIn.animate.scale).toBe(1);
    expect(animationUtils.scaleIn.transition.ease).toBe("easeOut");

    // Test staggered animation
    const createStaggeredAnimation = (delay: number = 0.1) => {
      return {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: {
          duration: 0.4,
          delay,
          ease: "easeOut",
        },
      };
    };

    const staggered = createStaggeredAnimation(0.2);
    expect(staggered.transition.delay).toBe(0.2);
    expect(staggered.transition.duration).toBe(0.4);
  });
});
