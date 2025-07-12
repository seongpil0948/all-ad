"use client";

import {
  useState,
  useEffect,
  useCallback,
  useTransition,
  useMemo,
  memo,
} from "react";
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
import { TimeSeriesData } from "@/stores/slices/analyticsDataSlice";
import log from "@/utils/logger";

interface AnalyticsClientProps {
  initialSummary: AnalyticsSummary;
  initialPlatformData: PlatformAnalytics[];
}

// Chart type options
const chartTypes = [
  { key: "line", label: "라인 차트", icon: FaChartLine },
  { key: "bar", label: "바 차트", icon: FaChartBar },
  { key: "pie", label: "파이 차트", icon: FaChartPie },
] as const;

// Metric options for charts
const metricOptions = [
  { key: "impressions", label: "노출수" },
  { key: "clicks", label: "클릭수" },
  { key: "cost", label: "비용" },
  { key: "conversions", label: "전환수" },
  { key: "revenue", label: "매출" },
] as const;

type MetricKey = keyof TimeSeriesData;

const AnalyticsClient = memo(function AnalyticsClient({
  initialSummary: _initialSummary,
  initialPlatformData,
}: AnalyticsClientProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedMetric, setSelectedMetric] =
    useState<MetricKey>("impressions");
  const [selectedChartType, setSelectedChartType] = useState("line");
  const [dateRange, setDateRange] = useState({
    start: parseDate(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    ),
    end: parseDate(new Date().toISOString().split("T")[0]),
  });

  // Use Zustand store with useShallow
  const {
    platformData = initialPlatformData,
    timeSeriesData,
    isLoading,
    fetchAnalytics,
    exportData,
  } = useAnalyticsStore(
    useShallow((state) => ({
      summary: state.summary,
      platformData: state.platformData,
      timeSeriesData: state.timeSeriesData,
      isLoading: state.isLoading,
      fetchAnalytics: state.fetchAnalytics,
      exportData: state.exportData,
    })),
  );

  // Effect 1: Fetch analytics when date range changes - separate concern
  useEffect(() => {
    startTransition(() => {
      fetchAnalytics({
        start: new Date(dateRange.start.toString()),
        end: new Date(dateRange.end.toString()),
      }).catch((err) => {
        log.error("Failed to fetch analytics", err);
      });
    });
  }, [dateRange, fetchAnalytics]);

  // Effect 2: Extract time series data from DOM - separate concern
  useEffect(() => {
    const container = document.querySelector(".time-series-data");

    if (container) {
      const impressions = container.getAttribute("data-impressions");
      const clicks = container.getAttribute("data-clicks");
      const cost = container.getAttribute("data-cost");
      const conversions = container.getAttribute("data-conversions");
      const revenue = container.getAttribute("data-revenue");

      if (impressions && clicks && cost && conversions && revenue) {
        // Update store with time series data
        useAnalyticsStore.setState({
          timeSeriesData: {
            impressions: JSON.parse(impressions),
            clicks: JSON.parse(clicks),
            cost: JSON.parse(cost),
            conversions: JSON.parse(conversions),
            revenue: JSON.parse(revenue),
          },
        });
      }
    }
  }, []);

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

  const handleMetricChange = useCallback((value: string) => {
    startTransition(() => {
      setSelectedMetric(value as MetricKey);
    });
  }, []);

  const handleChartTypeChange = useCallback((key: string) => {
    startTransition(() => {
      setSelectedChartType(key);
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardBody>
          <div className="flex flex-wrap gap-4 items-center">
            <DateRangePicker
              aria-label="데이터 분석 기간 선택"
              className="max-w-xs"
              label="기간 선택"
              value={dateRange}
              onChange={(value) => {
                if (value) {
                  setDateRange(value);
                }
              }}
            />
            <Select
              aria-label="분석 지표 선택"
              className="max-w-xs"
              label="지표 선택"
              selectedKeys={
                metricOptions.some((option) => option.key === selectedMetric)
                  ? [selectedMetric]
                  : []
              }
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as string;
                const validMetric = metricOptions.find(
                  (option) => option.key === value,
                );

                if (validMetric) {
                  handleMetricChange(value);
                }
              }}
            >
              {metricOptions.map((option) => (
                <SelectItem key={option.key}>{option.label}</SelectItem>
              ))}
            </Select>
            <Button
              isLoading={isLoading || isPending}
              startContent={<FaDownload />}
              onPress={handleExport}
            >
              데이터 내보내기
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Chart Type Tabs */}
      <Tabs
        selectedKey={selectedChartType}
        onSelectionChange={(key) => handleChartTypeChange(key as string)}
      >
        {chartTypes.map((type) => {
          const Icon = type.icon;

          return (
            <Tab
              key={type.key}
              title={
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span>{type.label}</span>
                </div>
              }
            >
              <Card className="mt-4">
                <CardHeader>
                  <h3 className="text-lg font-semibold">
                    {metricOptions.find((m) => m.key === selectedMetric)?.label}{" "}
                    추이
                  </h3>
                </CardHeader>
                <CardBody>
                  {isLoading || isPending ? (
                    <div className="h-96 flex items-center justify-center text-default-500">
                      데이터를 불러오는 중...
                    </div>
                  ) : chartOptions ? (
                    <EChart option={chartOptions} style={{ height: "400px" }} />
                  ) : (
                    <div className="h-96 flex items-center justify-center text-default-500">
                      데이터가 없습니다.
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
          <h3 className="text-lg font-semibold">플랫폼별 성과</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {platformData.map((platform) => (
              <Card key={platform.platform} className="border">
                <CardBody>
                  <h4 className="font-medium mb-3">{platform.platform}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-default-500">노출수:</span>
                      <span className="font-medium">
                        {platform.metrics.totalImpressions.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-default-500">클릭수:</span>
                      <span className="font-medium">
                        {platform.metrics.totalClicks.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-default-500">CTR:</span>
                      <span className="font-medium">
                        {platform.metrics.ctr.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-default-500">비용:</span>
                      <span className="font-medium">
                        ₩{platform.metrics.totalCost.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-default-500">ROAS:</span>
                      <span className="font-medium">
                        {platform.metrics.roas.toFixed(2)}x
                      </span>
                    </div>
                    {platform.trend !== 0 && (
                      <div className="pt-2 border-t">
                        <span
                          className={`text-xs ${platform.trend > 0 ? "text-success" : "text-danger"}`}
                        >
                          {platform.trend > 0 ? "▲" : "▼"}{" "}
                          {Math.abs(platform.trend).toFixed(1)}% 전기 대비
                        </span>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
});

export { AnalyticsClient };
