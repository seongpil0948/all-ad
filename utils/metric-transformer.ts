/**
 * Metric transformation utilities for consistent metric handling across platforms
 */

import { CampaignMetrics } from "@/types";

/**
 * Platform-specific metric field mappings
 */
const METRIC_MAPPINGS = {
  google: {
    impressions: "impressions",
    clicks: "clicks",
    cost: "costMicros", // Needs division by 1,000,000
    conversions: "conversions",
    revenue: "conversionValue",
    ctr: "ctr",
    cpc: "averageCpc", // Needs division by 1,000,000
    cpm: "averageCpm", // Needs division by 1,000,000
  },
  facebook: {
    impressions: "impressions",
    clicks: "clicks",
    cost: "spend",
    conversions: "conversions",
    revenue: "revenue",
    ctr: "ctr",
    cpc: "cpc",
    cpm: "cpm",
  },
  kakao: {
    impressions: "impCnt",
    clicks: "clickCnt",
    cost: "salesAmt",
    conversions: "convCnt",
    revenue: "revenue",
    ctr: "ctr",
    cpc: "cpc",
    cpm: "cpm",
  },
  naver: {
    impressions: "impressions",
    clicks: "clicks",
    cost: "cost",
    conversions: "conversions",
    revenue: "revenue",
    ctr: "ctr",
    cpc: "cpc",
    cpm: "cpm",
  },
  coupang: {
    impressions: "impressions",
    clicks: "clicks",
    cost: "cost",
    conversions: "conversions",
    revenue: "revenue",
    ctr: "ctr",
    cpc: "cpc",
    cpm: "cpm",
  },
} as const;

/**
 * Transform platform-specific metrics to standardized format
 */
export function transformPlatformMetrics(
  platform: keyof typeof METRIC_MAPPINGS,
  rawMetrics: Record<string, unknown>,
): CampaignMetrics {
  const mapping = METRIC_MAPPINGS[platform];
  const metrics: CampaignMetrics = {
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
    date: (rawMetrics.date as string) || new Date().toISOString().split("T")[0],
  };

  // Map fields
  for (const [key, sourceField] of Object.entries(mapping)) {
    if (rawMetrics[sourceField] !== undefined) {
      (metrics as unknown as Record<string, unknown>)[key] =
        rawMetrics[sourceField];
    }
  }

  // Platform-specific transformations
  if (platform === "google") {
    // Convert micros to currency for Google
    if (rawMetrics.costMicros !== undefined) {
      metrics.cost = (rawMetrics.costMicros as number) / 1_000_000;
    }
    if (rawMetrics.averageCpc !== undefined) {
      metrics.cpc = (rawMetrics.averageCpc as number) / 1_000_000;
    }
    if (rawMetrics.averageCpm !== undefined) {
      metrics.cpm = (rawMetrics.averageCpm as number) / 1_000_000;
    }
  } else if (platform === "facebook") {
    // Facebook costs are in cents
    if (rawMetrics.spend !== undefined) {
      metrics.cost = parseFloat(rawMetrics.spend as string);
    }
  }

  // Calculate derived metrics
  metrics.ctr =
    metrics.impressions > 0 ? (metrics.clicks / metrics.impressions) * 100 : 0;
  metrics.cpc = metrics.clicks > 0 ? metrics.cost / metrics.clicks : 0;
  metrics.cpm =
    metrics.impressions > 0 ? (metrics.cost / metrics.impressions) * 1000 : 0;
  metrics.roas = metrics.cost > 0 ? (metrics.revenue || 0) / metrics.cost : 0;
  metrics.roi =
    metrics.cost > 0
      ? (((metrics.revenue || 0) - metrics.cost) / metrics.cost) * 100
      : 0;

  return metrics;
}

/**
 * Calculate aggregate metrics from multiple metric entries
 */
export function aggregateMetrics(metrics: CampaignMetrics[]): CampaignMetrics {
  if (metrics.length === 0) {
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
    };
  }

  const totals = metrics.reduce(
    (acc, metric) => ({
      impressions: acc.impressions + metric.impressions,
      clicks: acc.clicks + metric.clicks,
      cost: acc.cost + metric.cost,
      conversions: (acc.conversions || 0) + (metric.conversions || 0),
      revenue: (acc.revenue || 0) + (metric.revenue || 0),
    }),
    { impressions: 0, clicks: 0, cost: 0, conversions: 0, revenue: 0 },
  );

  return {
    ...totals,
    ctr:
      totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
    cpc: totals.clicks > 0 ? totals.cost / totals.clicks : 0,
    cpm: totals.impressions > 0 ? (totals.cost / totals.impressions) * 1000 : 0,
    roas: totals.cost > 0 ? (totals.revenue || 0) / totals.cost : 0,
    roi:
      totals.cost > 0
        ? (((totals.revenue || 0) - totals.cost) / totals.cost) * 100
        : 0,
    date: metrics[0].date,
  };
}

/**
 * Format metric values for display
 */
export function formatMetricValue(
  value: number,
  type: keyof CampaignMetrics,
): string {
  switch (type) {
    case "impressions":
    case "clicks":
    case "conversions":
      return new Intl.NumberFormat().format(Math.round(value));

    case "cost":
    case "revenue":
    case "cpc":
    case "cpm":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);

    case "ctr":
    case "roi":
      return `${value.toFixed(2)}%`;

    case "roas":
      return value.toFixed(2);

    default:
      return value.toString();
  }
}
