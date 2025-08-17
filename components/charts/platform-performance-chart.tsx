"use client";

import type {
  AggregatedMetrics,
  ChartType,
  MetricsComparison,
  DateRange,
} from "@/types/ads-metrics.types";

import React, { useMemo, useCallback, useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Switch } from "@heroui/switch";
import { Tabs, Tab } from "@heroui/tabs";
import { Tooltip } from "@heroui/tooltip";
import { Badge } from "@heroui/badge";
import { Divider } from "@heroui/divider";
import { Chip } from "@heroui/chip";
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
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  RefreshCw,
  Eye,
  MousePointer,
  DollarSign,
  Target,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
} from "lucide-react";

import { EChart } from "./echart";
import { useDictionary } from "@/hooks/use-dictionary";

interface PlatformPerformanceChartProps {
  data: AggregatedMetrics;
  comparison?: MetricsComparison;
  title?: string;
  subtitle?: string;
  chartType?: ChartType;
  showTimeSeriesData?: boolean;
  showPerformanceInsights?: boolean;
  height?: number;
  width?: number;
  className?: string;
  onExport?: (format: "png" | "jpeg" | "pdf" | "svg") => void;
  onRefresh?: () => void;
  loading?: boolean;
  error?: string;
  dateRange?: DateRange;
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

const METRICS_CONFIG = {
  impressions: {
    label: "노출수",
    icon: Eye,
    color: "#3b82f6",
    format: "number",
  },
  clicks: {
    label: "클릭수",
    icon: MousePointer,
    color: "#10b981",
    format: "number",
  },
  cost: {
    label: "비용",
    icon: DollarSign,
    color: "#f59e0b",
    format: "currency",
  },
  conversions: {
    label: "전환수",
    icon: Target,
    color: "#8b5cf6",
    format: "number",
  },
  ctr: { label: "CTR", icon: Activity, color: "#06b6d4", format: "percentage" },
  cpc: { label: "CPC", icon: DollarSign, color: "#f97316", format: "currency" },
  cpm: { label: "CPM", icon: DollarSign, color: "#84cc16", format: "currency" },
  conversionRate: {
    label: "전환율",
    icon: TrendingUp,
    color: "#ec4899",
    format: "percentage",
  },
  costPerConversion: {
    label: "전환당 비용",
    icon: DollarSign,
    color: "#ef4444",
    format: "currency",
  },
  roas: { label: "ROAS", icon: TrendingUp, color: "#22c55e", format: "ratio" },
} as const;

const TIME_PERIODS = [
  { key: "LAST_7_DAYS", label: "지난 7일" },
  { key: "LAST_30_DAYS", label: "지난 30일" },
  { key: "LAST_90_DAYS", label: "지난 90일" },
] as const;

const CHART_TYPES = [
  { key: "line", label: "선 차트", icon: LineChart },
  { key: "bar", label: "막대 차트", icon: BarChart3 },
  { key: "area", label: "영역 차트", icon: Activity },
  { key: "pie", label: "원형 차트", icon: PieChart },
] as const;

export function PlatformPerformanceChart({
  data,
  comparison,
  title,
  subtitle,
  chartType = "line",
  showTimeSeriesData = true,
  showPerformanceInsights = true,
  height = 400,
  width,
  className,
  onExport,
  onRefresh,
  loading = false,
  error,
  dateRange = "LAST_30_DAYS",
}: PlatformPerformanceChartProps) {
  const { dictionary: dict } = useDictionary();
  const { theme } = useTheme();
  const [selectedTab, setSelectedTab] = useState<string>("overview");
  const [selectedMetric, setSelectedMetric] = useState<string>("impressions");
  const [selectedChartType, setSelectedChartType] =
    useState<ChartType>(chartType);
  const [isAnimated, setIsAnimated] = useState(true);

  const platformName = PLATFORM_NAMES[data.platform];
  const platformColor = PLATFORM_COLORS[data.platform];

  // 시계열 데이터 가공
  const timeSeriesData = useMemo(() => {
    if (!data.dataPoints || !showTimeSeriesData) return [];

    return data.dataPoints
      .sort(
        (a, b) =>
          new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime(),
      )
      .map((point) => {
        const { date, ...metrics } = point.metrics;

        return {
          date: date ?? point.lastUpdated,
          ...metrics,
        };
      });
  }, [data.dataPoints, showTimeSeriesData]);

  // 메트릭 요약 카드 데이터
  const metricsCards = useMemo(() => {
    const cards = [
      {
        id: "impressions",
        key: "impressions",
        title: "총 노출수",
        value: data.totalImpressions,
        change: comparison?.percentageChange.impressions || 0,
        icon: Eye,
        color: "text-blue-500",
        format: "number" as const,
      },
      {
        id: "clicks",
        key: "clicks",
        title: "총 클릭수",
        value: data.totalClicks,
        change: comparison?.percentageChange.clicks || 0,
        icon: MousePointer,
        color: "text-green-500",
        format: "number" as const,
      },
      {
        id: "cost",
        key: "cost",
        title: "총 비용",
        value: data.totalCost,
        change: comparison?.percentageChange.cost || 0,
        icon: DollarSign,
        color: "text-yellow-500",
        format: "currency" as const,
      },
      {
        id: "conversions",
        key: "conversions",
        title: "총 전환수",
        value: data.totalConversions,
        change: comparison?.percentageChange.conversions || 0,
        icon: Target,
        color: "text-purple-500",
        format: "number" as const,
      },
      {
        id: "ctr",
        key: "ctr",
        title: "평균 CTR",
        value: data.averageCtr,
        change: comparison?.percentageChange.ctr || 0,
        icon: Activity,
        color: "text-cyan-500",
        format: "percentage" as const,
      },
      {
        id: "roas",
        key: "roas",
        title: "평균 ROAS",
        value: data.averageRoas,
        change: comparison?.percentageChange.roas || 0,
        icon: TrendingUp,
        color: "text-green-600",
        format: "ratio" as const,
      },
    ];

    return cards;
  }, [data, comparison]);

  // 값 포맷팅 함수
  const formatValue = useCallback((value: number, format: string) => {
    switch (format) {
      case "currency":
        return `₩${value.toLocaleString()}`;
      case "percentage":
        return `${(value * 100).toFixed(2)}%`;
      case "ratio":
        return value.toFixed(2);
      case "number":
      default:
        return value.toLocaleString();
    }
  }, []);

  // 트렌드 아이콘 및 색상 결정
  const getTrendInfo = useCallback((change: number) => {
    if (change > 0) {
      return { icon: TrendingUp, color: "text-green-500", sign: "+" };
    } else if (change < 0) {
      return { icon: TrendingDown, color: "text-red-500", sign: "" };
    } else {
      return { icon: Minus, color: "text-gray-500", sign: "" };
    }
  }, []);

  // ECharts 옵션 생성
  const chartOption = useMemo(() => {
    const isDark = theme === "dark";
    const textColor = isDark ? "#ffffff" : "#000000";
    const backgroundColor = isDark ? "#18181b" : "#ffffff";

    if (selectedTab === "overview") {
      // 개요 차트 - 주요 메트릭들을 함께 표시
      const metricsData = [
        { name: "노출수", value: data.totalImpressions, color: "#3b82f6" },
        { name: "클릭수", value: data.totalClicks, color: "#10b981" },
        { name: "전환수", value: data.totalConversions, color: "#8b5cf6" },
      ];

      return {
        backgroundColor,
        title: {
          text: `${platformName} 성과 개요`,
          left: "center",
          textStyle: { color: textColor },
        },
        tooltip: {
          trigger: "item",
          backgroundColor: isDark ? "#27272a" : "#ffffff",
          textStyle: { color: textColor },
        },
        legend: {
          top: "10%",
          left: "center",
          textStyle: { color: textColor },
        },
        series: [
          {
            name: "성과 지표",
            type: "pie",
            radius: ["40%", "70%"],
            center: ["50%", "60%"],
            data: metricsData,
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: "rgba(0, 0, 0, 0.5)",
              },
            },
          },
        ],
        animation: isAnimated,
      };
    } else if (selectedTab === "trends" && timeSeriesData.length > 0) {
      // 트렌드 차트 - 시계열 데이터
      const dates = timeSeriesData.map((d) =>
        new Date(d.date).toLocaleDateString(),
      );
      const values = timeSeriesData.map(
        (d) => d[selectedMetric as keyof typeof d] as number,
      );

      return {
        backgroundColor,
        title: {
          text: `${platformName} - ${METRICS_CONFIG[selectedMetric as keyof typeof METRICS_CONFIG]?.label} 추이`,
          left: "center",
          textStyle: { color: textColor },
        },
        tooltip: {
          trigger: "axis",
          backgroundColor: isDark ? "#27272a" : "#ffffff",
          textStyle: { color: textColor },
        },
        xAxis: {
          type: "category",
          data: dates,
          axisLabel: { color: textColor },
        },
        yAxis: {
          type: "value",
          axisLabel: {
            color: textColor,
            formatter: (value: number) =>
              formatValue(
                value,
                METRICS_CONFIG[selectedMetric as keyof typeof METRICS_CONFIG]
                  ?.format || "number",
              ),
          },
        },
        series: [
          {
            name: METRICS_CONFIG[selectedMetric as keyof typeof METRICS_CONFIG]
              ?.label,
            type: selectedChartType,
            data: values,
            smooth: true,
            itemStyle: { color: platformColor },
            areaStyle:
              selectedChartType === "area"
                ? { color: platformColor, opacity: 0.3 }
                : undefined,
          },
        ],
        animation: isAnimated,
      };
    }

    return {};
  }, [
    theme,
    selectedTab,
    data,
    platformName,
    platformColor,
    timeSeriesData,
    selectedMetric,
    selectedChartType,
    isAnimated,
    formatValue,
  ]);

  // 성과 인사이트 생성
  const performanceInsights = useMemo(() => {
    if (!showPerformanceInsights) return [];

    const insights = [];

    // CTR 분석
    if (data.averageCtr > 0.03) {
      insights.push({
        type: "positive",
        title: "높은 CTR",
        message: `평균 CTR ${(data.averageCtr * 100).toFixed(2)}%로 업계 평균보다 높습니다.`,
        recommendation:
          "현재 광고 소재와 타겟팅이 효과적입니다. 비슷한 전략을 다른 캠페인에도 적용해보세요.",
      });
    } else if (data.averageCtr < 0.01) {
      insights.push({
        type: "negative",
        title: "낮은 CTR",
        message: `평균 CTR ${(data.averageCtr * 100).toFixed(2)}%로 개선이 필요합니다.`,
        recommendation: "광고 소재를 개선하고 타겟팅을 재검토해보세요.",
      });
    }

    // 비용 효율성 분석
    if (data.averageRoas > 4) {
      insights.push({
        type: "positive",
        title: "높은 ROAS",
        message: `ROAS ${data.averageRoas.toFixed(2)}로 매우 효율적입니다.`,
        recommendation: "예산을 증액하여 성과를 확대해보세요.",
      });
    } else if (data.averageRoas < 2) {
      insights.push({
        type: "negative",
        title: "낮은 ROAS",
        message: `ROAS ${data.averageRoas.toFixed(2)}로 수익성이 낮습니다.`,
        recommendation:
          "입찰 전략을 재검토하고 전환율이 높은 키워드에 집중하세요.",
      });
    }

    // 전환율 분석
    if (data.averageConversionRate > 0.05) {
      insights.push({
        type: "positive",
        title: "높은 전환율",
        message: `전환율 ${(data.averageConversionRate * 100).toFixed(2)}%로 우수합니다.`,
        recommendation: "현재 랜딩 페이지와 사용자 경험을 유지하세요.",
      });
    }

    return insights;
  }, [data, showPerformanceInsights]);

  const handleExport = useCallback(
    (format: "png" | "jpeg" | "pdf" | "svg") => {
      if (onExport) {
        onExport(format);
      }
    },
    [onExport],
  );

  const detailedMetricsTableColumns = useMemo(
    () => [
      { key: "metric", label: "메트릭" },
      { key: "currentValue", label: "현재값", align: "end" as const },
      { key: "change", label: "변화율", align: "end" as const },
      { key: "status", label: "상태", align: "end" as const },
    ],
    [],
  );

  const renderDetailedMetricCell = useCallback(
    (card: (typeof metricsCards)[0], columnKey: string) => {
      const trendInfo = getTrendInfo(card.change);

      switch (columnKey) {
        case "metric":
          return card.title;
        case "currentValue":
          return formatValue(card.value, card.format);
        case "change":
          return (
            <span className={trendInfo.color}>
              {trendInfo.sign}
              {Math.abs(card.change).toFixed(1)}%
            </span>
          );
        case "status":
          return (
            <Chip
              color={
                card.change > 0
                  ? "success"
                  : card.change < 0
                    ? "danger"
                    : "default"
              }
              size="sm"
              variant="flat"
            >
              {card.change > 0 ? "개선" : card.change < 0 ? "악화" : "유지"}
            </Chip>
          );
        default:
          return null;
      }
    },
    [formatValue, getTrendInfo],
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
      <Card>
        <CardHeader className="pb-0">
          <div className="flex justify-between items-start w-full">
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: platformColor }}
              />
              <div>
                <h3 className="text-lg font-semibold">
                  {title || platformName}
                </h3>
                {subtitle && (
                  <p className="text-small text-gray-500">{subtitle}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge color="primary" variant="flat">
                {TIME_PERIODS.find((p) => p.key === dateRange)?.label}
              </Badge>
              <span className="text-small text-gray-500">
                {new Date(data.lastUpdated).toLocaleString()}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardBody>
          {/* 메트릭 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {metricsCards.map((card) => {
              const trendInfo = getTrendInfo(card.change);
              const TrendIcon = trendInfo.icon;
              const CardIcon = card.icon;

              return (
                <Card key={card.key} className="p-4">
                  <CardBody className="p-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CardIcon className={`w-5 h-5 ${card.color}`} />
                        <span className="text-small text-gray-500">
                          {card.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendIcon className={`w-4 h-4 ${trendInfo.color}`} />
                        <span className={`text-small ${trendInfo.color}`}>
                          {trendInfo.sign}
                          {Math.abs(card.change).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="text-2xl font-bold">
                      {formatValue(card.value, card.format)}
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>

          <Divider className="mb-6" />

          {/* 탭 네비게이션 */}
          <Tabs
            className="mb-6"
            selectedKey={selectedTab}
            onSelectionChange={(key) => setSelectedTab(key as string)}
          >
            <Tab
              key="overview"
              title={dict.analytics.ui?.tabs?.overview ?? "Overview"}
            />
            <Tab
              key="trends"
              title={dict.analytics.ui?.tabs?.trends ?? "Trends"}
            />
            <Tab
              key="breakdown"
              title={dict.analytics.ui?.tabs?.breakdown ?? "Breakdown"}
            />
            <Tab
              key="insights"
              title={dict.analytics.ui?.tabs?.insights ?? "Insights"}
            />
          </Tabs>

          {/* 컨트롤 패널 */}
          {selectedTab === "trends" && (
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <Select
                className="max-w-xs"
                label={dict.analytics.ui?.selectMetric ?? dict.common.select}
                size="sm"
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
              >
                {Object.entries(METRICS_CONFIG).map(([key, config]) => (
                  <SelectItem key={key}>{config.label}</SelectItem>
                ))}
              </Select>

              <Select
                className="max-w-xs"
                label={dict.adsPerformanceDashboard?.chartType ?? "Chart Type"}
                size="sm"
                value={selectedChartType}
                onChange={(e) =>
                  setSelectedChartType(e.target.value as ChartType)
                }
              >
                {CHART_TYPES.map((type) => (
                  <SelectItem key={type.key}>{type.label}</SelectItem>
                ))}
              </Select>

              <Switch
                isSelected={isAnimated}
                size="sm"
                onValueChange={setIsAnimated}
              >
                {dict.analytics.ui?.animation ?? "Animation"}
              </Switch>

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
          )}

          {/* 차트 영역 */}
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

            {selectedTab === "insights" ? (
              <div className="space-y-4">
                {performanceInsights.length > 0 ? (
                  performanceInsights.map((insight, index) => (
                    <Card
                      key={index}
                      className={`border-l-4 ${
                        insight.type === "positive"
                          ? "border-green-500"
                          : "border-red-500"
                      }`}
                    >
                      <CardBody className="p-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-2 h-2 rounded-full mt-2 ${
                              insight.type === "positive"
                                ? "bg-green-500"
                                : "bg-red-500"
                            }`}
                          />
                          <div className="flex-1">
                            <h4 className="font-medium mb-1">
                              {insight.title}
                            </h4>
                            <p className="text-small text-gray-600 mb-2">
                              {insight.message}
                            </p>
                            <p className="text-small text-blue-600">
                              {insight.recommendation}
                            </p>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-500">
                      {dict.analytics.ui?.noInsights ??
                        "Not enough data to generate insights."}
                    </div>
                  </div>
                )}
              </div>
            ) : selectedTab === "breakdown" ? (
              <div className="space-y-6">
                {/* 상세 메트릭 테이블 */}
                <div>
                  <h4 className="text-medium font-semibold mb-4">
                    {dict.analytics.ui?.detailedMetrics ?? "Detailed Metrics"}
                  </h4>
                  <Table
                    aria-label={dict.dashboard.charts.performance}
                    classNames={{
                      wrapper: "overflow-x-auto",
                      table: "w-full text-small",
                      th: "text-left p-2",
                      td: "p-2",
                    }}
                  >
                    <TableHeader columns={detailedMetricsTableColumns}>
                      {(column) => (
                        <TableColumn key={column.key} align={column.align}>
                          {column.label}
                        </TableColumn>
                      )}
                    </TableHeader>
                    <TableBody
                      emptyContent={dict.common.noData}
                      items={metricsCards}
                    >
                      {(item) => (
                        <TableRow key={item.id}>
                          {(columnKey) => (
                            <TableCell>
                              {renderDetailedMetricCell(
                                item,
                                columnKey as string,
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <EChart
                className="w-full"
                option={chartOption}
                style={{
                  height: `${height}px`,
                  width: width ? `${width}px` : "100%",
                }}
              />
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
