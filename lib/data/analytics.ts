import { cache } from "react";
import "server-only";

import { createClient } from "@/utils/supabase/server";
import { getPlatformCredentials } from "@/lib/auth/platform-auth";
import { PlatformType } from "@/types";
import log from "@/utils/logger";

// Types for analytics data
export interface AnalyticsData {
  date: string;
  platform: PlatformType;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  revenue: number;
}

export interface AnalyticsSummary {
  totalImpressions: number;
  totalClicks: number;
  totalCost: number;
  totalConversions: number;
  totalRevenue: number;
  ctr: number;
  cpc: number;
  cpm: number;
  roas: number;
  roi: number;
}

export interface PlatformAnalytics {
  platform: PlatformType;
  metrics: AnalyticsSummary;
  trend: number; // Percentage change from previous period
}

// Cache analytics data fetching to prevent duplicate requests
export const getAnalyticsData = cache(
  async (teamId: string, dateRange: { start: Date; end: Date }) => {
    const supabase = await createClient();

    try {
      // First, check if we have valid platform credentials
      const credentials = await getPlatformCredentials(teamId);

      if (credentials.length === 0) {
        log.warn("No platform credentials found for team", { teamId });

        return [];
      }

      // Get analytics data from campaign_metrics joined with campaigns to get platform info
      const { data, error } = await supabase
        .from("campaign_metrics")
        .select(
          `
          date,
          impressions,
          clicks,
          cost,
          conversions,
          revenue,
          campaigns!inner(platform)
        `,
        )
        .eq("campaigns.team_id", teamId)
        .gte("date", dateRange.start.toISOString().split("T")[0])
        .lte("date", dateRange.end.toISOString().split("T")[0])
        .order("date", { ascending: true });

      if (error) {
        log.error("Failed to fetch analytics data", error);
        throw error;
      }

      // Group and aggregate data by date and platform
      const dataMap = new Map<string, AnalyticsData>();

      data?.forEach((row) => {
        const platform = (row as any).campaigns?.platform as PlatformType;
        const key = `${row.date}-${platform}`;
        const existing = dataMap.get(key);

        if (existing) {
          // Aggregate metrics for the same date/platform
          existing.impressions += row.impressions || 0;
          existing.clicks += row.clicks || 0;
          existing.cost += row.cost || 0;
          existing.conversions += row.conversions || 0;
          existing.revenue += row.revenue || 0;
        } else {
          dataMap.set(key, {
            date: row.date,
            platform: platform,
            impressions: row.impressions || 0,
            clicks: row.clicks || 0,
            cost: row.cost || 0,
            conversions: row.conversions || 0,
            revenue: row.revenue || 0,
          });
        }
      });

      return Array.from(dataMap.values()).sort(
        (a, b) =>
          a.date.localeCompare(b.date) || a.platform.localeCompare(b.platform),
      );
    } catch (error) {
      log.error("Error in getAnalyticsData", error);
      throw error;
    }
  },
);

// Cache analytics summary calculation
export const getAnalyticsSummary = cache(
  async (
    teamId: string,
    dateRange: { start: Date; end: Date },
  ): Promise<AnalyticsSummary> => {
    const data = await getAnalyticsData(teamId, dateRange);

    const summary = data.reduce(
      (acc, item) => {
        acc.totalImpressions += item.impressions || 0;
        acc.totalClicks += item.clicks || 0;
        acc.totalCost += item.cost || 0;
        acc.totalConversions += item.conversions || 0;
        acc.totalRevenue += item.revenue || 0;

        return acc;
      },
      {
        totalImpressions: 0,
        totalClicks: 0,
        totalCost: 0,
        totalConversions: 0,
        totalRevenue: 0,
        ctr: 0,
        cpc: 0,
        cpm: 0,
        roas: 0,
        roi: 0,
      },
    );

    // Calculate derived metrics
    if (summary.totalImpressions > 0) {
      summary.ctr = (summary.totalClicks / summary.totalImpressions) * 100;
      summary.cpm = (summary.totalCost / summary.totalImpressions) * 1000;
    }

    if (summary.totalClicks > 0) {
      summary.cpc = summary.totalCost / summary.totalClicks;
    }

    if (summary.totalCost > 0) {
      summary.roas = summary.totalRevenue / summary.totalCost;
      summary.roi =
        ((summary.totalRevenue - summary.totalCost) / summary.totalCost) * 100;
    }

    return summary;
  },
);

// Cache platform-specific analytics
export const getPlatformAnalytics = cache(
  async (
    teamId: string,
    dateRange: { start: Date; end: Date },
  ): Promise<PlatformAnalytics[]> => {
    const data = await getAnalyticsData(teamId, dateRange);

    // Group by platform
    const platformMap = new Map<PlatformType, AnalyticsData[]>();

    data.forEach((item) => {
      const existing = platformMap.get(item.platform) || [];

      existing.push(item);
      platformMap.set(item.platform, existing);
    });

    // Calculate metrics for each platform
    const platformAnalytics: PlatformAnalytics[] = [];

    for (const [platform, platformData] of platformMap) {
      const metrics = platformData.reduce(
        (acc, item) => {
          acc.totalImpressions += item.impressions || 0;
          acc.totalClicks += item.clicks || 0;
          acc.totalCost += item.cost || 0;
          acc.totalConversions += item.conversions || 0;
          acc.totalRevenue += item.revenue || 0;

          return acc;
        },
        {
          totalImpressions: 0,
          totalClicks: 0,
          totalCost: 0,
          totalConversions: 0,
          totalRevenue: 0,
          ctr: 0,
          cpc: 0,
          cpm: 0,
          roas: 0,
          roi: 0,
        },
      );

      // Calculate derived metrics
      if (metrics.totalImpressions > 0) {
        metrics.ctr = (metrics.totalClicks / metrics.totalImpressions) * 100;
        metrics.cpm = (metrics.totalCost / metrics.totalImpressions) * 1000;
      }

      if (metrics.totalClicks > 0) {
        metrics.cpc = metrics.totalCost / metrics.totalClicks;
      }

      if (metrics.totalCost > 0) {
        metrics.roas = metrics.totalRevenue / metrics.totalCost;
        metrics.roi =
          ((metrics.totalRevenue - metrics.totalCost) / metrics.totalCost) *
          100;
      }

      // TODO: Calculate trend from previous period
      const trend = 0;

      platformAnalytics.push({
        platform,
        metrics,
        trend,
      });
    }

    return platformAnalytics;
  },
);

// Cache time series data for charts
export const getTimeSeriesData = cache(
  async (
    teamId: string,
    dateRange: { start: Date; end: Date },
    metric: keyof AnalyticsData,
  ) => {
    const data = await getAnalyticsData(teamId, dateRange);

    // Group by date
    const dateMap = new Map<string, number>();

    data.forEach((item) => {
      const existing = dateMap.get(item.date) || 0;
      const value = (item[metric] as number) || 0;

      dateMap.set(item.date, existing + value);
    });

    // Convert to array format for charts
    return Array.from(dateMap.entries())
      .map(([date, value]) => ({
        date,
        value,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },
);

// Preload all analytics data in parallel
export const preloadAnalyticsData = (
  teamId: string,
  dateRange: { start: Date; end: Date },
) => {
  // These will run in parallel due to React.cache
  void getAnalyticsData(teamId, dateRange);
  void getAnalyticsSummary(teamId, dateRange);
  void getPlatformAnalytics(teamId, dateRange);

  // Preload common time series metrics
  void getTimeSeriesData(teamId, dateRange, "impressions");
  void getTimeSeriesData(teamId, dateRange, "clicks");
  void getTimeSeriesData(teamId, dateRange, "cost");
  void getTimeSeriesData(teamId, dateRange, "revenue");
};
