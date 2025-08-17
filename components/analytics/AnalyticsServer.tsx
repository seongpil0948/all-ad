import { Suspense } from "react";

import { AnalyticsClient } from "./AnalyticsClient";

import {
  getAnalyticsSummary,
  getPlatformAnalytics,
  getTimeSeriesData,
  preloadAnalyticsData,
} from "@/lib/data/analytics";
import {
  MetricCardSkeleton,
  ChartSkeleton,
} from "@/components/common/skeletons";
import { AutoGrid } from "@/components/common/AutoGrid";
import { getDictionary, type Locale } from "@/app/[lang]/dictionaries";

interface AnalyticsServerProps {
  teamId: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  locale: Locale;
}

// Summary component with its own suspense boundary
async function AnalyticsSummarySection({
  teamId,
  dateRange,
  dictionary,
}: {
  teamId: string;
  dateRange: { start: Date; end: Date };
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
}) {
  const summary = await getAnalyticsSummary(teamId, dateRange);

  return (
    <AutoGrid minItemWidth={220} gap={"gap-4" as const}>
      <div className="stat-card">
        <h3 className="text-sm text-default-500">
          {dictionary.analytics.totalImpressions}
        </h3>
        <p className="text-2xl font-bold">
          {summary.totalImpressions.toLocaleString()}
        </p>
      </div>
      <div className="stat-card">
        <h3 className="text-sm text-default-500">
          {dictionary.analytics.totalClicks}
        </h3>
        <p className="text-2xl font-bold">
          {summary.totalClicks.toLocaleString()}
        </p>
        <p className="text-xs text-default-400">
          {dictionary.analytics.ctr} {summary.ctr.toFixed(2)}%
        </p>
      </div>
      <div className="stat-card">
        <h3 className="text-sm text-default-500">
          {dictionary.analytics.totalCost}
        </h3>
        <p className="text-2xl font-bold">
          ₩{summary.totalCost.toLocaleString()}
        </p>
        <p className="text-xs text-default-400">
          {dictionary.analytics.cpc} ₩{summary.cpc.toFixed(0)}
        </p>
      </div>
      <div className="stat-card">
        <h3 className="text-sm text-default-500">
          {dictionary.analytics.totalConversions}
        </h3>
        <p className="text-2xl font-bold">
          {summary.totalConversions.toLocaleString()}
        </p>
      </div>
      <div className="stat-card">
        <h3 className="text-sm text-default-500">
          {dictionary.analytics.roas}
        </h3>
        <p className="text-2xl font-bold">
          {summary.roas.toFixed(2)}
          {dictionary.analytics.ui?.multiplierSuffix ?? "x"}
        </p>
        <p className="text-xs text-default-400">
          {dictionary.analytics.roi} {summary.roi.toFixed(1)}%
        </p>
      </div>
    </AutoGrid>
  );
}

// Platform analytics with its own suspense boundary
async function PlatformAnalyticsSection({
  teamId,
  dateRange,
  dictionary,
}: {
  teamId: string;
  dateRange: { start: Date; end: Date };
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
}) {
  const platformData = await getPlatformAnalytics(teamId, dateRange);

  return (
    <AutoGrid minItemWidth={260} gap={"gap-4" as const}>
      {platformData.map((platform) => (
        <div key={platform.platform} className="platform-card">
          <h4 className="font-medium mb-2">{platform.platform}</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>{dictionary.analytics.impressions}:</span>
              <span>{platform.metrics.totalImpressions.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>{dictionary.analytics.clicks}:</span>
              <span>{platform.metrics.totalClicks.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>{dictionary.analytics.cost}:</span>
              <span>₩{platform.metrics.totalCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>{dictionary.analytics.roas}:</span>
              <span>
                {platform.metrics.roas.toFixed(2)}
                {dictionary.analytics.ui?.multiplierSuffix ?? "x"}
              </span>
            </div>
          </div>
        </div>
      ))}
    </AutoGrid>
  );
}

// Time series data with its own suspense boundary
async function TimeSeriesSection({
  teamId,
  dateRange,
}: {
  teamId: string;
  dateRange: { start: Date; end: Date };
}) {
  const [impressions, clicks, cost, conversions, revenue] = await Promise.all([
    getTimeSeriesData(teamId, dateRange, "impressions"),
    getTimeSeriesData(teamId, dateRange, "clicks"),
    getTimeSeriesData(teamId, dateRange, "cost"),
    getTimeSeriesData(teamId, dateRange, "conversions"),
    getTimeSeriesData(teamId, dateRange, "revenue"),
  ]);

  return (
    <div
      className="time-series-data"
      data-clicks={JSON.stringify(clicks)}
      data-conversions={JSON.stringify(conversions)}
      data-cost={JSON.stringify(cost)}
      data-impressions={JSON.stringify(impressions)}
      data-revenue={JSON.stringify(revenue)}
    >
      {/* Data will be consumed by client component */}
    </div>
  );
}

// Main server component with streaming support
export async function AnalyticsServer({
  teamId,
  dateRange,
  locale,
}: AnalyticsServerProps) {
  // Preload all data in parallel
  preloadAnalyticsData(teamId, dateRange);
  const dictionary = await getDictionary(locale);

  // Fetch initial data for client component
  const [summary, platformData] = await Promise.all([
    getAnalyticsSummary(teamId, dateRange),
    getPlatformAnalytics(teamId, dateRange),
  ]);

  return (
    <div className="space-y-8">
      {/* Summary section streams independently */}
      <Suspense
        fallback={
          <AutoGrid minItemWidth={220} gap={"gap-4" as const}>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </AutoGrid>
        }
      >
        <AnalyticsSummarySection
          dateRange={dateRange}
          teamId={teamId}
          dictionary={dictionary}
        />
      </Suspense>

      {/* Platform analytics streams independently */}
      <Suspense
        fallback={
          <AutoGrid minItemWidth={300} gap={"gap-4" as const}>
            <ChartSkeleton />
            <ChartSkeleton />
            <ChartSkeleton />
          </AutoGrid>
        }
      >
        <PlatformAnalyticsSection
          dateRange={dateRange}
          teamId={teamId}
          dictionary={dictionary}
        />
      </Suspense>

      {/* Time series data for charts */}
      <Suspense fallback={<ChartSkeleton className="h-96" />}>
        <TimeSeriesSection dateRange={dateRange} teamId={teamId} />
      </Suspense>

      {/* Client component with initial data */}
      <AnalyticsClient
        initialPlatformData={platformData}
        initialSummary={summary}
      />
    </div>
  );
}
