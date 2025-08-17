"use client";

import type {
  MultiPlatformMetrics,
  ChartType,
} from "@/types/ads-metrics.types";

import React, { useMemo, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Switch } from "@heroui/switch";
import { Tooltip } from "@heroui/tooltip";
import { Badge } from "@heroui/badge";
import { Divider } from "@heroui/divider";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { useTheme } from "next-themes";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  RefreshCw,
} from "lucide-react";

import { EChart } from "./echart";
import { useDictionary } from "@/hooks/use-dictionary";

interface MultiPlatformChartProps {
  data: MultiPlatformMetrics;
  title?: string;
  subtitle?: string;
  chartType?: ChartType;
  showPlatformComparison?: boolean;
  showLegend?: boolean;
  height?: number;
  width?: number;
  className?: string;
  onExport?: (format: "png" | "jpeg" | "pdf" | "svg") => void;
  onRefresh?: () => void;
  loading?: boolean;
  error?: string;
  showMetricsCards?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const PLATFORM_COLORS = {
  google_ads: "#4285f4",
  meta_ads: "#1877f2",
  tiktok_ads: "#ff0050",
  amazon_ads: "#ff9900",
} as const;

const PLATFORM_NAMES = {
  google_ads: "Google Ads",
  meta_ads: "Meta Ads",
  tiktok_ads: "TikTok Ads",
  amazon_ads: "Amazon Ads",
} as const;

const CHART_TYPES = [
  { key: "line" },
  { key: "bar" },
  { key: "area" },
  { key: "pie" },
] as const;

const METRICS_OPTIONS = [
  { key: "impressions" },
  { key: "clicks" },
  { key: "cost" },
  { key: "conversions" },
  { key: "ctr" },
  { key: "cpc" },
  { key: "cpm" },
  { key: "conversionRate" },
  { key: "costPerConversion" },
  { key: "roas" },
] as const;

type MetricOptionKey = (typeof METRICS_OPTIONS)[number]["key"];

export function MultiPlatformChart({
  data,
  title,
  subtitle,
  chartType = "bar",
  showPlatformComparison = true,
  showLegend = true,
  height = 400,
  width,
  className,
  onExport,
  onRefresh,
  loading = false,
  error,
  showMetricsCards = true,
  autoRefresh = false,
  refreshInterval = 30000,
}: MultiPlatformChartProps) {
  const { dictionary: dict } = useDictionary();
  const { theme } = useTheme();
  const [selectedMetric, setSelectedMetric] =
    React.useState<MetricOptionKey>("impressions");
  const [selectedChartType, setSelectedChartType] =
    React.useState<ChartType>(chartType);
  const [isAnimated, setIsAnimated] = React.useState(true);
  const [showDataLabels, setShowDataLabels] = React.useState(false);

  // 자동 새로고침 설정
  React.useEffect(() => {
    if (autoRefresh && onRefresh) {
      const interval = setInterval(onRefresh, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, onRefresh, refreshInterval]);

  // 차트 데이터 가공
  const chartData = useMemo(() => {
    if (!data || !data.platformBreakdown) return null;

    const platforms = data.platformBreakdown.map((platform) => ({
      platform: platform.platform,
      name: PLATFORM_NAMES[platform.platform],
      color: PLATFORM_COLORS[platform.platform],
      metrics: {
        impressions: platform.totalImpressions,
        clicks: platform.totalClicks,
        cost: platform.totalCost,
        conversions: platform.totalConversions,
        ctr: platform.averageCtr,
        cpc: platform.averageCpc,
        cpm: platform.averageCpm,
        conversionRate: platform.averageConversionRate,
        costPerConversion: platform.averageCostPerConversion,
        roas: platform.averageRoas,
      },
    }));

    return platforms;
  }, [data]);

  // ECharts 옵션 생성
  const chartOption = useMemo(() => {
    if (!chartData) return {};

    const isDark = theme === "dark";
    const textColor = isDark ? "#ffffff" : "#000000";
    const backgroundColor = isDark ? "#18181b" : "#ffffff";

    const getMetricLabel = (key: (typeof METRICS_OPTIONS)[number]["key"]) =>
      String(dict.analytics[key as keyof typeof dict.analytics] ?? key);

    const baseOption = {
      backgroundColor,
      title: {
        text: title,
        subtext: subtitle,
        left: "center",
        textStyle: {
          color: textColor,
          fontSize: 18,
          fontWeight: "bold",
        },
        subtextStyle: {
          color: textColor,
          fontSize: 12,
        },
      },
      tooltip: {
        trigger: "axis" as const,
        axisPointer: {
          type: "shadow",
        },
        backgroundColor: isDark ? "#27272a" : "#ffffff",
        borderColor: isDark ? "#3f3f46" : "#e4e4e7",
        textStyle: {
          color: textColor,
        },
        formatter: (params: unknown) => {
          const param = Array.isArray(params) ? params[0] : params;
          const value = param.value;
          const platform = param.name;

          let formattedValue = value;

          if (selectedMetric === "cost") {
            formattedValue = `₩${value.toLocaleString()}`;
          } else if (
            selectedMetric === "ctr" ||
            selectedMetric === "conversionRate"
          ) {
            formattedValue = `${(value * 100).toFixed(2)}%`;
          } else if (
            selectedMetric === "cpc" ||
            selectedMetric === "cpm" ||
            selectedMetric === "costPerConversion"
          ) {
            formattedValue = `₩${value.toLocaleString()}`;
          } else if (selectedMetric === "roas") {
            formattedValue = `${value.toFixed(2)}`;
          } else {
            formattedValue = value.toLocaleString();
          }

          return `${platform}<br/>${getMetricLabel(selectedMetric)}: ${formattedValue}`;
        },
      },
      legend: showLegend
        ? {
            show: true,
            top: 50,
            textStyle: {
              color: textColor,
            },
          }
        : { show: false },
      grid: {
        left: 60,
        right: 40,
        top: showLegend ? 100 : 80,
        bottom: 60,
      },
      animation: isAnimated,
      animationDuration: 1000,
      animationEasing: "cubicOut",
    };

    if (selectedChartType === "pie") {
      return {
        ...baseOption,
        series: [
          {
            name: getMetricLabel(selectedMetric),
            type: "pie",
            radius: "70%",
            center: ["50%", "50%"],
            data: chartData.map((item) => ({
              name: item.name,
              value: item.metrics[selectedMetric as keyof typeof item.metrics],
              itemStyle: {
                color: item.color,
              },
            })),
            label: {
              show: showDataLabels,
              position: "outside",
              formatter: "{b}: {d}%",
              color: textColor,
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: "rgba(0, 0, 0, 0.5)",
              },
            },
          },
        ],
      };
    }

    return {
      ...baseOption,
      xAxis: {
        type: "category",
        data: chartData.map((item) => item.name),
        axisLabel: {
          color: textColor,
          rotate: 45,
        },
        axisLine: {
          lineStyle: {
            color: isDark ? "#3f3f46" : "#e4e4e7",
          },
        },
      },
      yAxis: {
        type: "value",
        axisLabel: {
          color: textColor,
          formatter: (value: number) => {
            if (
              selectedMetric === "cost" ||
              selectedMetric === "cpc" ||
              selectedMetric === "cpm" ||
              selectedMetric === "costPerConversion"
            ) {
              return `₩${value.toLocaleString()}`;
            } else if (
              selectedMetric === "ctr" ||
              selectedMetric === "conversionRate"
            ) {
              return `${(value * 100).toFixed(1)}%`;
            } else if (selectedMetric === "roas") {
              return value.toFixed(1);
            }

            return value.toLocaleString();
          },
        },
        axisLine: {
          lineStyle: {
            color: isDark ? "#3f3f46" : "#e4e4e7",
          },
        },
        splitLine: {
          lineStyle: {
            color: isDark ? "#3f3f46" : "#e4e4e7",
          },
        },
      },
      series: [
        {
          name: getMetricLabel(selectedMetric),
          type: selectedChartType === "area" ? "line" : selectedChartType,
          data: chartData.map((item) => ({
            value: item.metrics[selectedMetric as keyof typeof item.metrics],
            itemStyle: {
              color: item.color,
            },
          })),
          areaStyle: selectedChartType === "area" ? {} : undefined,
          smooth: selectedChartType === "line" || selectedChartType === "area",
          label: {
            show: showDataLabels,
            position: "top",
            color: textColor,
            formatter: (params: unknown) => {
              const value = (params as { value: number }).value;

              if (
                selectedMetric === "cost" ||
                selectedMetric === "cpc" ||
                selectedMetric === "cpm" ||
                selectedMetric === "costPerConversion"
              ) {
                return `₩${value.toLocaleString()}`;
              } else if (
                selectedMetric === "ctr" ||
                selectedMetric === "conversionRate"
              ) {
                return `${(value * 100).toFixed(1)}%`;
              } else if (selectedMetric === "roas") {
                return value.toFixed(1);
              }

              return value.toLocaleString();
            },
          },
          emphasis: {
            focus: "series",
          },
        },
      ],
    };
  }, [
    chartData,
    selectedMetric,
    selectedChartType,
    theme,
    title,
    subtitle,
    showLegend,
    isAnimated,
    showDataLabels,
    dict,
  ]);

  // 메트릭 카드 데이터
  const metricsCards = useMemo(() => {
    if (!data) return [];

    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0)
        return { direction: "stable" as const, percentage: 0 };
      const change = ((current - previous) / previous) * 100;

      return {
        direction:
          change > 0
            ? ("up" as const)
            : change < 0
              ? ("down" as const)
              : ("stable" as const),
        percentage: Math.abs(change),
      };
    };

    return [
      {
        title: "총 노출수",
        value: data.totalImpressions.toLocaleString(),
        trend: calculateTrend(
          data.totalImpressions,
          data.totalImpressions * 0.9,
        ), // 임시 데이터
        icon: <BarChart3 className="w-5 h-5" />,
      },
      {
        title: "총 클릭수",
        value: data.totalClicks.toLocaleString(),
        trend: calculateTrend(data.totalClicks, data.totalClicks * 0.95),
        icon: <TrendingUp className="w-5 h-5" />,
      },
      {
        title: "총 비용",
        value: `₩${data.totalCost.toLocaleString()}`,
        trend: calculateTrend(data.totalCost, data.totalCost * 1.1),
        icon: <TrendingDown className="w-5 h-5" />,
      },
      {
        title: "총 전환수",
        value: data.totalConversions.toLocaleString(),
        trend: calculateTrend(
          data.totalConversions,
          data.totalConversions * 0.85,
        ),
        icon: <TrendingUp className="w-5 h-5" />,
      },
      {
        title: "평균 CTR",
        value: `${(data.overallCtr * 100).toFixed(2)}%`,
        trend: calculateTrend(data.overallCtr, data.overallCtr * 0.9),
        icon: <BarChart3 className="w-5 h-5" />,
      },
      {
        title: "평균 ROAS",
        value: data.overallRoas.toFixed(2),
        trend: calculateTrend(data.overallRoas, data.overallRoas * 0.8),
        icon: <TrendingUp className="w-5 h-5" />,
      },
    ];
  }, [data]);

  const handleExport = useCallback(
    (format: "png" | "jpeg" | "pdf" | "svg") => {
      if (onExport) {
        onExport(format);
      }
    },
    [onExport],
  );

  const handleMetricChange = useCallback((metric: MetricOptionKey) => {
    setSelectedMetric(metric);
  }, []);

  const handleChartTypeChange = useCallback((type: ChartType) => {
    setSelectedChartType(type);
  }, []);

  // Type for chart data items
  type ChartDataItem = NonNullable<typeof chartData>[0];

  const tableColumns = useMemo(
    () => [
      { key: "platform", label: "플랫폼" },
      { key: "impressions", label: "노출수", align: "end" as const },
      { key: "clicks", label: "클릭수", align: "end" as const },
      { key: "cost", label: "비용", align: "end" as const },
      { key: "ctr", label: "CTR", align: "end" as const },
      { key: "cpc", label: "CPC", align: "end" as const },
      { key: "conversions", label: "전환수", align: "end" as const },
      { key: "roas", label: "ROAS", align: "end" as const },
    ],
    [],
  );

  const renderPlatformCell = useCallback(
    (platform: ChartDataItem, columnKey: string) => {
      switch (columnKey) {
        case "platform":
          return (
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: platform.color }}
              />
              {platform.name}
            </div>
          );
        case "impressions":
          return platform.metrics.impressions.toLocaleString();
        case "clicks":
          return platform.metrics.clicks.toLocaleString();
        case "cost":
          return `₩${platform.metrics.cost.toLocaleString()}`;
        case "ctr":
          return `${(platform.metrics.ctr * 100).toFixed(2)}%`;
        case "cpc":
          return `₩${platform.metrics.cpc.toLocaleString()}`;
        case "conversions":
          return platform.metrics.conversions.toLocaleString();
        case "roas":
          return platform.metrics.roas.toFixed(2);
        default:
          return null;
      }
    },
    [],
  );

  if (error) {
    return (
      <Card className={className}>
        <CardBody className="text-center py-8">
          <div className="text-red-500 mb-2">{dict.common.error}</div>
          <div className="text-small text-gray-500">{error}</div>
          {onRefresh && (
            <Button
              className="mt-4"
              color="primary"
              size="sm"
              variant="light"
              onClick={onRefresh}
            >
              {dict.common.retry}
            </Button>
          )}
        </CardBody>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* 메트릭 카드 */}
      {showMetricsCards && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          {metricsCards.map((card, index) => (
            <Card key={index} className="p-4">
              <CardBody className="p-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {card.icon}
                    <div className="text-small text-gray-500">{card.title}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    {card.trend.direction === "up" && (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    )}
                    {card.trend.direction === "down" && (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                    {card.trend.direction === "stable" && (
                      <Minus className="w-4 h-4 text-gray-500" />
                    )}
                    <span
                      className={`text-small ${
                        card.trend.direction === "up"
                          ? "text-green-500"
                          : card.trend.direction === "down"
                            ? "text-red-500"
                            : "text-gray-500"
                      }`}
                    >
                      {card.trend.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="text-2xl font-bold mt-2">{card.value}</div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* 차트 컨테이너 */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex justify-between items-start w-full">
            <div>
              <h3 className="text-lg font-semibold">{title}</h3>
              {subtitle && (
                <p className="text-small text-gray-500">{subtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {autoRefresh && (
                <Badge color="success" variant="flat">
                  {dict.adsPerformanceDashboard?.realtime ?? "Realtime"}
                </Badge>
              )}
              <span className="text-small text-gray-500">
                {(dict.analytics.ui?.lastUpdated ?? "Last updated:") + " "}
                {new Date(data.lastUpdated).toLocaleString()}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardBody>
          {/* 컨트롤 패널 */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <Select
              className="max-w-xs"
              label={dict.analytics.ui?.selectMetric ?? dict.common.select}
              size="sm"
              value={selectedMetric}
              onChange={(e) =>
                handleMetricChange(e.target.value as MetricOptionKey)
              }
            >
              {METRICS_OPTIONS.map((metric) => (
                <SelectItem key={metric.key}>
                  {String(
                    dict.analytics[metric.key as keyof typeof dict.analytics] ??
                      metric.key,
                  )}
                </SelectItem>
              ))}
            </Select>

            <Select
              className="max-w-xs"
              label={dict.adsPerformanceDashboard?.chartType ?? "Chart Type"}
              size="sm"
              value={selectedChartType}
              onChange={(e) =>
                handleChartTypeChange(e.target.value as ChartType)
              }
            >
              {CHART_TYPES.map((type) => (
                <SelectItem key={type.key}>
                  {type.key === "line"
                    ? dict.adsPerformanceDashboard?.lineChart
                    : type.key === "bar"
                      ? dict.adsPerformanceDashboard?.barChart
                      : type.key === "area"
                        ? dict.adsPerformanceDashboard?.areaChart
                        : dict.adsPerformanceDashboard?.pieChart}
                </SelectItem>
              ))}
            </Select>

            <div className="flex items-center gap-4">
              <Switch
                isSelected={isAnimated}
                size="sm"
                onValueChange={setIsAnimated}
              >
                {dict.analytics.ui?.animation ?? "Animation"}
              </Switch>

              <Switch
                isSelected={showDataLabels}
                size="sm"
                onValueChange={setShowDataLabels}
              >
                {dict.analytics.ui?.dataLabels ?? "Data labels"}
              </Switch>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {onRefresh && (
                <Tooltip content={dict.common.refresh}>
                  <Button
                    isIconOnly
                    isLoading={loading}
                    size="sm"
                    variant="light"
                    onClick={onRefresh}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </Tooltip>
              )}

              {onExport && (
                <Tooltip content={dict.common.export}>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onClick={() => handleExport("png")}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </Tooltip>
              )}
            </div>
          </div>

          <Divider className="mb-6" />

          {/* 차트 */}
          <div className="relative">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2" />
                  <div className="text-small text-gray-500">
                    {dict.common.loading}
                  </div>
                </div>
              </div>
            )}

            <EChart
              className="w-full"
              option={chartOption}
              style={{
                height: `${height}px`,
                width: width ? `${width}px` : "100%",
              }}
            />
          </div>

          {/* 플랫폼 비교 테이블 */}
          {showPlatformComparison && chartData && (
            <div className="mt-6">
              <h4 className="text-medium font-semibold mb-4">
                {dict.analytics.ui?.platformComparisonTitle ??
                  dict.dashboard.charts.platforms}
              </h4>
              <Table
                aria-label={dict.dashboard.charts.platforms}
                classNames={{
                  wrapper: "overflow-x-auto",
                  table: "w-full text-small",
                  th: "text-left p-2",
                  td: "p-2",
                }}
              >
                <TableHeader columns={tableColumns}>
                  {(column) => (
                    <TableColumn key={column.key} align={column.align}>
                      {column.label}
                    </TableColumn>
                  )}
                </TableHeader>
                <TableBody
                  emptyContent={dict.common.noData}
                  items={chartData || []}
                >
                  {(item) => (
                    <TableRow key={item.platform}>
                      {(columnKey) => (
                        <TableCell>
                          {renderPlatformCell(item, columnKey as string)}
                        </TableCell>
                      )}
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
