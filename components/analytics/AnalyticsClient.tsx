"use client";

import { useEffect, useCallback, useTransition, useMemo, memo } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { DateRangePicker } from "@heroui/date-picker";
import { Select, SelectItem } from "@heroui/select";
import { Tabs, Tab } from "@heroui/tabs";
import { useShallow } from "zustand/shallow";
import { parseDate } from "@internationalized/date";
import {
  FaChartLine,
  FaChartBar,
  FaChartPie,
  FaDownload,
} from "react-icons/fa";

import { useAnalyticsStore } from "@/stores";
import { EChart } from "@/components/charts/echart";
import { AnalyticsSummary, PlatformAnalytics } from "@/lib/data/analytics";
import log from "@/utils/logger";
import { useDictionary } from "@/hooks/use-dictionary";

import { MetricKey, ChartType } from "@/stores/slices/analyticsUiSlice";

interface AnalyticsClientProps {
  initialSummary: AnalyticsSummary;
  initialPlatformData: PlatformAnalytics[];
}

// Chart type options (labels from dictionary at render time)
const chartTypes = [
  { key: "line", icon: FaChartLine },
  { key: "bar", icon: FaChartBar },
  { key: "pie", icon: FaChartPie },
] as const;

// Metric options for charts (labels from dictionary at render time)
const metricOptions = [
  { key: "impressions" },
  { key: "clicks" },
  { key: "cost" },
  { key: "conversions" },
  { key: "revenue" },
] as const;

const ARROW_UP = "▲" as const;
const ARROW_DOWN = "▼" as const;

const AnalyticsClient = memo(function AnalyticsClient({
  initialPlatformData,
}: AnalyticsClientProps) {
  const { dictionary: dict } = useDictionary();
  const [isPending, startTransition] = useTransition();

  // Use Zustand store with useShallow for all state
  const {
    platformData = initialPlatformData,
    timeSeriesData,
    isLoading,
    fetchAnalytics,
    exportData,
    selectedMetric,
    selectedChartType,
    dateRange,
    setSelectedMetric,
    setSelectedChartType,
    setDateRange,
  } = useAnalyticsStore(
    useShallow((state) => ({
      summary: state.summary,
      platformData: state.platformData,
      timeSeriesData: state.timeSeriesData,
      isLoading: state.isLoading,
      fetchAnalytics: state.fetchAnalytics,
      exportData: state.exportData,
      selectedMetric: state.selectedMetric,
      selectedChartType: state.selectedChartType,
      dateRange: state.dateRange,
      setSelectedMetric: state.setSelectedMetric,
      setSelectedChartType: state.setSelectedChartType,
      setDateRange: state.setDateRange,
    })),
  );

  // Effect to fetch analytics when date range changes
  useEffect(() => {
    startTransition(() => {
      fetchAnalytics({
        start: dateRange.start,
        end: dateRange.end,
      }).catch((err) => {
        log.error("Failed to fetch analytics", err);
      });
    });
  }, [dateRange, fetchAnalytics]);

  // Memoized chart options
  const chartOptions = useMemo(() => {
    if (!timeSeriesData || !timeSeriesData[selectedMetric]) {
      return null;
    }

    const data = timeSeriesData[selectedMetric];

    switch (selectedChartType) {
      case "line":
        return {
          tooltip: { trigger: "axis" },
          xAxis: {
            type: "category",
            data: data.map((item) => item.date),
          },
          yAxis: { type: "value" },
          series: [
            {
              data: data.map((item) => item.value),
              type: "line",
              smooth: true,
            },
          ],
        };
      case "bar":
        return {
          tooltip: { trigger: "axis" },
          xAxis: {
            type: "category",
            data: data.map((item) => item.date),
          },
          yAxis: { type: "value" },
          series: [
            {
              data: data.map((item) => item.value),
              type: "bar",
            },
          ],
        };
      case "pie": {
        // For pie chart, aggregate by platform
        const platformAggregated = platformData.map((p) => {
          let value = 0;

          switch (selectedMetric) {
            case "impressions":
              value = p.metrics.totalImpressions;
              break;
            case "clicks":
              value = p.metrics.totalClicks;
              break;
            case "cost":
              value = p.metrics.totalCost;
              break;
            case "conversions":
              value = p.metrics.totalConversions;
              break;
            case "revenue":
              value = p.metrics.totalRevenue;
              break;
          }

          return { name: p.platform, value };
        });

        return {
          tooltip: { trigger: "item" },
          series: [
            {
              type: "pie",
              radius: "50%",
              data: platformAggregated,
            },
          ],
        };
      }
      default:
        return null;
    }
  }, [timeSeriesData, selectedMetric, selectedChartType, platformData]);

  // Callbacks
  const handleExport = useCallback(async () => {
    try {
      await exportData("csv");
      log.info("Analytics data exported successfully");
    } catch (error) {
      log.error("Failed to export analytics data", error);
    }
  }, [exportData]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardBody>
          <div className="flex flex-wrap gap-4 items-center">
            <DateRangePicker
              aria-label={dict.dashboard.filters.dateRange}
              className="max-w-xs"
              label={dict.dashboard.filters.dateRange}
              value={{
                start: parseDate(dateRange.start),
                end: parseDate(dateRange.end),
              }}
              onChange={(value) => {
                if (value) {
                  setDateRange({
                    start: value.start.toString(),
                    end: value.end.toString(),
                  });
                }
              }}
            />
            <Select
              aria-label={dict.analytics.ui?.selectMetric ?? dict.common.select}
              className="max-w-xs"
              label={dict.analytics.ui?.selectMetric ?? dict.common.select}
              selectedKeys={[selectedMetric]}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as MetricKey;
                if (value) {
                  setSelectedMetric(value);
                }
              }}
            >
              {metricOptions.map((option) => (
                <SelectItem key={option.key}>
                  {
                    dict.analytics[
                      option.key as keyof typeof dict.analytics
                    ] as string
                  }
                </SelectItem>
              ))}
            </Select>
            <Button
              isLoading={isLoading || isPending}
              startContent={<FaDownload />}
              onPress={handleExport}
            >
              {dict.common.export}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Chart Type Tabs */}
      <Tabs
        selectedKey={selectedChartType}
        onSelectionChange={(key) => setSelectedChartType(key as ChartType)}
      >
        {chartTypes.map((type) => {
          const Icon = type.icon;

          return (
            <Tab
              key={type.key}
              title={
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span>
                    {type.key === "line"
                      ? dict.adsPerformanceDashboard?.lineChart
                      : type.key === "bar"
                        ? dict.adsPerformanceDashboard?.barChart
                        : dict.adsPerformanceDashboard?.pieChart}
                  </span>
                </div>
              }
            >
              <Card className="mt-4">
                <CardHeader>
                  <h3 className="text-lg font-semibold">
                    {dict.analytics[selectedMetric] as string}
                  </h3>
                </CardHeader>
                <CardBody>
                  {isLoading || isPending ? (
                    <div className="h-96 flex items-center justify-center text-default-500">
                      {dict.common.loading}
                    </div>
                  ) : chartOptions ? (
                    <EChart
                      option={chartOptions}
                      aspectRatio={16 / 9}
                      className="w-full"
                    />
                  ) : (
                    <div className="h-96 flex items-center justify-center text-default-500">
                      {dict.common.noData}
                    </div>
                  )}
                </CardBody>
              </Card>
            </Tab>
          );
        })}
      </Tabs>

      {/* Platform Breakdown */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">
            {dict.dashboard.charts.platforms}
          </h3>
        </CardHeader>
        <CardBody>
          <div className="mt-2">
            <div className="sr-only" role="heading" aria-level={2}>
              {dict.dashboard.charts.platforms}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {platformData.map((platform) => (
                <Card key={platform.platform} className="border">
                  <CardBody>
                    <h4 className="font-medium mb-3">{platform.platform}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-default-500">
                          {dict.analytics.impressions}:
                        </span>
                        <span className="font-medium">
                          {platform.metrics.totalImpressions.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-default-500">
                          {dict.analytics.clicks}:
                        </span>
                        <span className="font-medium">
                          {platform.metrics.totalClicks.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-default-500">
                          {dict.analytics.ctr}:
                        </span>
                        <span className="font-medium">
                          {platform.metrics.ctr.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-default-500">
                          {dict.analytics.cost}:
                        </span>
                        <span className="font-medium">
                          ₩{platform.metrics.totalCost.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-default-500">
                          {dict.analytics.roas}:
                        </span>
                        <span className="font-medium">
                          {platform.metrics.roas.toFixed(2)}
                          {dict.analytics.ui?.multiplierSuffix ?? "x"}
                        </span>
                      </div>
                      {platform.trend !== 0 && (
                        <div className="pt-2 border-t">
                          <span
                            className={`text-xs ${platform.trend > 0 ? "text-success" : "text-danger"}`}
                          >
                            {(platform.trend > 0 ? ARROW_UP : ARROW_DOWN) + " "}
                            {Math.abs(platform.trend).toFixed(1)}%{" "}
                            {dict.analytics.ui?.vsPreviousPeriod ?? ""}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
});

export { AnalyticsClient };
