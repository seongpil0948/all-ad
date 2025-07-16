"use server";

import type {
  AggregatedMetrics,
  MetricsData,
  MultiPlatformMetrics,
} from "@/types/ads-metrics.types";

import log from "@/utils/logger";
import { GoogleAdsTestCredentials } from "@/services/platforms/api-clients/google-ads-api";
import { MetaAdsTestCredentials as MetaCreds } from "@/services/platforms/api-clients/meta-ads-api";

// Re-export types for external use
export type { GoogleAdsTestCredentials };
export type MetaAdsTestCredentials = MetaCreds;

// Meta Ads specific actions
export async function exchangeMetaToken(shortLivedToken: string): Promise<{
  success: boolean;
  data?: { accessToken: string };
  error?: string;
}> {
  try {
    const response = await fetch(
      "https://graph.facebook.com/v18.0/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.META_APP_ID,
          client_secret: process.env.META_APP_SECRET,
          redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/lab`,
          code: shortLivedToken,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Meta token exchange failed: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      data: { accessToken: data.access_token },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Token exchange failed",
    };
  }
}

export async function fetchMetaAdsAccounts(
  credentials: MetaCreds,
): Promise<{ success: boolean; data?: unknown[]; error?: string }> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_status,currency,timezone_name&access_token=${credentials.accessToken}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Meta API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      data: data.data || [],
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch accounts",
    };
  }
}

export async function fetchMetaCampaigns(
  credentials: MetaCreds,
  accountId: string,
): Promise<{ success: boolean; data?: unknown[]; error?: string }> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${accountId}/campaigns?fields=id,name,status,created_time,updated_time,objective&access_token=${credentials.accessToken}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Meta API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      data: data.data || [],
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch campaigns",
    };
  }
}

export async function updateMetaCampaignStatus(
  credentials: MetaCreds,
  campaignId: string,
  status: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Map our status to Facebook's values
    const facebookStatus = status === "active" ? "ACTIVE" : "PAUSED";

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${campaignId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: facebookStatus,
          access_token: credentials.accessToken,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Meta API error: ${response.status}`);
    }

    const data = await response.json();

    log.info("Meta campaign status updated successfully", {
      campaignId,
      status: facebookStatus,
      success: data.success,
    });

    return {
      success: true,
    };
  } catch (error) {
    log.error("Failed to update Meta campaign status", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Status update failed",
    };
  }
}

export async function batchUpdateMetaCampaignStatus(
  credentials: MetaCreds,
  campaignIds: string[],
  status: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Map our status to Facebook's values
    const facebookStatus = status === "active" ? "ACTIVE" : "PAUSED";

    // Process campaigns in batches to avoid rate limits
    const batchSize = 10;
    const results = [];

    for (let i = 0; i < campaignIds.length; i += batchSize) {
      const batch = campaignIds.slice(i, i + batchSize);
      const batchPromises = batch.map((campaignId) =>
        updateMetaCampaignStatus(credentials, campaignId, status),
      );

      const batchResults = await Promise.allSettled(batchPromises);

      results.push(...batchResults);

      // Add a small delay between batches to respect rate limits
      if (i + batchSize < campaignIds.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Count successful updates
    const successCount = results.filter(
      (result) => result.status === "fulfilled" && result.value.success,
    ).length;

    const failCount = results.length - successCount;

    log.info("Meta batch campaign status update completed", {
      total: campaignIds.length,
      successful: successCount,
      failed: failCount,
      status: facebookStatus,
    });

    if (failCount > 0) {
      return {
        success: false,
        error: `${failCount} out of ${campaignIds.length} campaigns failed to update`,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    log.error("Failed to batch update Meta campaign status", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Batch update failed",
    };
  }
}

export async function clearMetaCache(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Clear any local cache data for Meta/Facebook ads
    // This could include clearing Redis cache, local storage, or memory cache

    // For now, we'll implement a simple cache clearing mechanism
    // In a real implementation, you would:
    // 1. Clear Redis cache keys related to Meta ads
    // 2. Clear any in-memory cache
    // 3. Reset any cached API responses

    log.info("Clearing Meta ads cache");

    // Example: Clear Redis cache (if Redis is available)
    try {
      const { createClient } = await import("redis");
      const redis = createClient({ url: process.env.REDIS_URL });

      await redis.connect();

      // Clear Meta-related cache keys
      const cacheKeys = await redis.keys("meta_ads:*");

      if (cacheKeys.length > 0) {
        await redis.del(cacheKeys);
        log.info("Cleared Meta ads cache keys", { count: cacheKeys.length });
      }

      await redis.quit();
    } catch (redisError) {
      log.warn("Redis cache clearing failed", {
        error:
          redisError instanceof Error ? redisError.message : "Unknown error",
      });
      // Don't fail the whole operation if Redis is unavailable
    }

    // Clear any other cache systems here
    // For example, if you have a memory cache, clear it here

    log.info("Meta ads cache cleared successfully");

    return {
      success: true,
    };
  } catch (error) {
    log.error("Failed to clear Meta ads cache", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Cache clearing failed",
    };
  }
}

// 통합 광고 메트릭스 가져오기
export async function fetchMultiPlatformMetrics(
  platformCredentials: {
    google_ads?: GoogleAdsTestCredentials;
    meta_ads?: MetaCreds; // Use the aliased type
  },
  platformAccounts: Array<{
    platform: "google_ads" | "meta_ads" | "tiktok_ads" | "amazon_ads";
    accountId: string;
  }>,
  filters?: {
    dateRange?: "LAST_7_DAYS" | "LAST_30_DAYS" | "LAST_90_DAYS";
    customDateRange?: { startDate: string; endDate: string };
    metrics?: string[];
  },
): Promise<{
  success: boolean;
  data?: {
    platforms: string[];
    totalImpressions: number;
    totalClicks: number;
    totalCost: number;
    totalConversions: number;
    overallCtr: number;
    overallCpc: number;
    overallCpm: number;
    overallConversionRate: number;
    overallCostPerConversion: number;
    overallRoas: number;
    platformBreakdown: Array<{
      platform: string;
      totalImpressions: number;
      totalClicks: number;
      totalCost: number;
      totalConversions: number;
      averageCtr: number;
      averageCpc: number;
      averageCpm: number;
      averageConversionRate: number;
      averageCostPerConversion: number;
      averageRoas: number;
      dataPoints: MetricsData[];
      dateRange: string;
      lastUpdated: string;
    }>;
    dateRange: string;
    lastUpdated: string;
  };
  error?: string;
}> {
  try {
    log.info("Fetching multi-platform metrics", { platformAccounts, filters });

    const { AdsMetricsService } = await import(
      "@/services/analytics/ads-metrics.service"
    );
    const metricsService = new AdsMetricsService(platformCredentials);

    const result = await metricsService.getMultiPlatformMetrics(
      platformAccounts,
      {
        platforms: platformAccounts.map((pa) => pa.platform),
        dateRange: filters?.dateRange || "LAST_30_DAYS",
        customDateRange: filters?.customDateRange,
        accounts: platformAccounts.map((pa) => pa.accountId),
        campaigns: [],
        metrics: filters?.metrics || [
          "impressions",
          "clicks",
          "cost",
          "conversions",
          "ctr",
          "roas",
        ],
        groupBy: "platform",
        sortBy: { field: "cost", direction: "desc" },
      },
    );

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    log.error("Failed to fetch multi-platform metrics", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "통합 메트릭스 조회 실패",
    };
  }
}

// 개별 플랫폼 메트릭스 가져오기
export async function fetchPlatformMetrics(
  platform: "google_ads" | "meta_ads" | "tiktok_ads" | "amazon_ads",
  credentials: GoogleAdsTestCredentials | MetaCreds, // Use the aliased type
  accountId: string,
  filters?: {
    dateRange?: "LAST_7_DAYS" | "LAST_30_DAYS" | "LAST_90_DAYS";
    customDateRange?: { startDate: string; endDate: string };
    campaignId?: string;
    metrics?: string[];
  },
): Promise<{
  success: boolean;
  data?: {
    platform: string;
    totalImpressions: number;
    totalClicks: number;
    totalCost: number;
    totalConversions: number;
    averageCtr: number;
    averageCpc: number;
    averageCpm: number;
    averageConversionRate: number;
    averageCostPerConversion: number;
    averageRoas: number;
    dataPoints: MetricsData[];
    dateRange: string;
    lastUpdated: string;
  };
  error?: string;
}> {
  try {
    log.info("Fetching platform metrics", { platform, accountId, filters });

    const { AdsMetricsService } = await import(
      "@/services/analytics/ads-metrics.service"
    );
    const metricsService = new AdsMetricsService({
      [platform]: credentials,
    });

    const result = await metricsService.getAggregatedMetrics(
      platform,
      accountId,
      {
        platforms: [platform],
        dateRange: filters?.dateRange || "LAST_30_DAYS",
        customDateRange: filters?.customDateRange,
        accounts: [accountId],
        campaigns: filters?.campaignId ? [filters.campaignId] : [],
        metrics: filters?.metrics || [
          "impressions",
          "clicks",
          "cost",
          "conversions",
          "ctr",
          "roas",
        ],
        groupBy: "campaign",
        sortBy: { field: "cost", direction: "desc" },
      },
    );

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    log.error("Failed to fetch platform metrics", error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "플랫폼 메트릭스 조회 실패",
    };
  }
}

// 실시간 메트릭스 업데이트
export async function getRealtimeMetrics(
  platformCredentials: {
    google_ads?: GoogleAdsTestCredentials;
    meta_ads?: MetaCreds;
  },
  platformAccounts: Array<{
    platform: "google_ads" | "meta_ads" | "tiktok_ads" | "amazon_ads";
    accountId: string;
  }>,
  lastUpdateTime?: string,
): Promise<{
  success: boolean;
  data?: {
    updates: Array<{
      platform: string;
      accountId: string;
      timestamp: string;
      metrics: Partial<MetricsData>;
      changeType: "update" | "new" | "delete";
    }>;
    hasUpdates: boolean;
    lastChecked: string;
  };
  error?: string;
}> {
  try {
    log.info("Fetching realtime metrics", { platformAccounts, lastUpdateTime });

    // 실제 구현에서는 각 플랫폼의 웹훅이나 실시간 API를 사용
    // 현재는 임시로 변경사항이 있다고 가정
    const updates = platformAccounts.map(({ platform, accountId }) => ({
      platform,
      accountId,
      timestamp: new Date().toISOString(),
      metrics: {
        impressions: Math.floor(Math.random() * 1000),
        clicks: Math.floor(Math.random() * 100),
        cost: Math.floor(Math.random() * 10000),
        conversions: Math.floor(Math.random() * 10),
      },
      changeType: "update" as const,
    }));

    return {
      success: true,
      data: {
        updates: updates as Array<{
          platform: string;
          accountId: string;
          timestamp: string;
          metrics: Partial<MetricsData>;
          changeType: "update" | "new" | "delete";
        }>, // Demo data - type assertion for build compatibility
        hasUpdates: updates.length > 0,
        lastChecked: new Date().toISOString(),
      },
    };
  } catch (error) {
    log.error("Failed to fetch realtime metrics", error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "실시간 메트릭스 조회 실패",
    };
  }
}

// 메트릭스 내보내기
export async function exportMetrics(
  data: MultiPlatformMetrics | AggregatedMetrics,
  format: "csv" | "xlsx" | "json" | "pdf",
  options?: {
    columns?: string[];
    filename?: string;
    includeCharts?: boolean;
  },
): Promise<{
  success: boolean;
  data?: {
    filename: string;
    downloadUrl: string;
    expiresAt: string;
  };
  error?: string;
}> {
  try {
    log.info("Exporting metrics", { format, options });

    // 실제 구현에서는 선택한 형식에 따라 파일 생성
    const filename =
      options?.filename ||
      `ads_metrics_${new Date().toISOString().split("T")[0]}.${format}`;
    const downloadUrl = `/api/exports/${filename}`; // 임시 URL
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24시간 후 만료

    return {
      success: true,
      data: {
        filename,
        downloadUrl,
        expiresAt,
      },
    };
  } catch (error) {
    log.error("Failed to export metrics", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "메트릭스 내보내기 실패",
    };
  }
}

// 메트릭스 알림 생성
export async function createMetricsAlert(alertConfig: {
  platform: "google_ads" | "meta_ads" | "tiktok_ads" | "amazon_ads";
  accountId: string;
  campaignId?: string;
  alertType:
    | "performance_drop"
    | "budget_exceeded"
    | "conversion_spike"
    | "cpc_increase"
    | "custom";
  threshold: {
    metric: string;
    operator: ">" | "<" | "=" | ">=" | "<=";
    value: number;
  };
  severity: "critical" | "warning" | "info";
  message: string;
}): Promise<{
  success: boolean;
  data?: {
    id: string;
    alertType: string;
    message: string;
    triggeredAt: string;
    acknowledged: boolean;
  };
  error?: string;
}> {
  try {
    log.info("Creating metrics alert", { alertConfig });

    // 실제 구현에서는 데이터베이스에 알림 저장
    const alert = {
      id: `alert_${Date.now()}`,
      ...alertConfig,
      triggeredAt: new Date().toISOString(),
      acknowledged: false,
    };

    return {
      success: true,
      data: alert,
    };
  } catch (error) {
    log.error("Failed to create metrics alert", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "알림 생성 실패",
    };
  }
}
