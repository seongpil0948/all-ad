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

interface AnalyticsServerProps {
  teamId: string;
  dateRange: {
    start: Date;
    end: Date;
  };
}

// Summary component with its own suspense boundary
async function AnalyticsSummarySection({
  teamId,
  dateRange,
}: {
  teamId: string;
  dateRange: { start: Date; end: Date };
}) {
  const summary = await getAnalyticsSummary(teamId, dateRange);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <div className="stat-card">
        <h3 className="text-sm text-default-500">총 노출수</h3>
        <p className="text-2xl font-bold">
          {summary.totalImpressions.toLocaleString()}
        </p>
      </div>
      <div className="stat-card">
        <h3 className="text-sm text-default-500">총 클릭수</h3>
        <p className="text-2xl font-bold">
          {summary.totalClicks.toLocaleString()}
        </p>
        <p className="text-xs text-default-400">
          CTR {summary.ctr.toFixed(2)}%
        </p>
      </div>
      <div className="stat-card">
        <h3 className="text-sm text-default-500">총 비용</h3>
        <p className="text-2xl font-bold">
          ₩{summary.totalCost.toLocaleString()}
        </p>
        <p className="text-xs text-default-400">
          CPC ₩{summary.cpc.toFixed(0)}
        </p>
      </div>
      <div className="stat-card">
        <h3 className="text-sm text-default-500">전환수</h3>
        <p className="text-2xl font-bold">
          {summary.totalConversions.toLocaleString()}
        </p>
      </div>
      <div className="stat-card">
        <h3 className="text-sm text-default-500">ROAS</h3>
        <p className="text-2xl font-bold">{summary.roas.toFixed(2)}x</p>
        <p className="text-xs text-default-400">
          ROI {summary.roi.toFixed(1)}%
        </p>
      </div>
    </div>
  );
}

// Platform analytics with its own suspense boundary
async function PlatformAnalyticsSection({
  teamId,
  dateRange,
}: {
  teamId: string;
  dateRange: { start: Date; end: Date };
}) {
  const platformData = await getPlatformAnalytics(teamId, dateRange);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {platformData.map((platform) => (
        <div key={platform.platform} className="platform-card">
          <h4 className="font-medium mb-2">{platform.platform}</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>노출수:</span>
              <span>{platform.metrics.totalImpressions.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>클릭수:</span>
              <span>{platform.metrics.totalClicks.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>비용:</span>
              <span>₩{platform.metrics.totalCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>ROAS:</span>
              <span>{platform.metrics.roas.toFixed(2)}x</span>
            </div>
          </div>
        </div>
      ))}
    </div>
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
}: AnalyticsServerProps) {
  // Preload all data in parallel
  preloadAnalyticsData(teamId, dateRange);

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </div>
        }
      >
        <AnalyticsSummarySection dateRange={dateRange} teamId={teamId} />
      </Suspense>

      {/* Platform analytics streams independently */}
      <Suspense
        fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ChartSkeleton />
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        }
      >
        <PlatformAnalyticsSection dateRange={dateRange} teamId={teamId} />
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
