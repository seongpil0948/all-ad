// 광고 분석 유틸리티 함수들
import type {
  PlatformMetrics,
  AggregatedMetrics,
  MetricsComparison,
  ChartConfig,
  ChartType,
} from "@/types/ads-metrics.types";

import log from "@/utils/logger";

// 플랫폼 설정
export const PLATFORM_CONFIG = {
  google_ads: {
    name: "Google Ads",
    displayName: "Google 광고",
    color: "#4285f4",
    icon: "🔍",
    description: "구글 검색, 디스플레이, 유튜브 광고",
    apiEndpoint: "https://googleads.googleapis.com/v20",
    defaultMetrics: [
      "impressions",
      "clicks",
      "cost",
      "conversions",
      "ctr",
      "cpc",
      "quality_score",
    ],
    supportedChartTypes: ["line", "bar", "area", "pie"] as ChartType[],
  },
  meta_ads: {
    name: "Meta Ads",
    displayName: "메타 광고",
    color: "#1877f2",
    icon: "👥",
    description: "페이스북, 인스타그램 광고",
    apiEndpoint: "https://graph.facebook.com/v21.0",
    defaultMetrics: [
      "impressions",
      "clicks",
      "cost",
      "conversions",
      "reach",
      "frequency",
      "engagement",
    ],
    supportedChartTypes: ["line", "bar", "area", "pie"] as ChartType[],
  },
  tiktok_ads: {
    name: "TikTok Ads",
    displayName: "틱톡 광고",
    color: "#ff0050",
    icon: "🎵",
    description: "틱톡 비디오 광고",
    apiEndpoint: "https://business-api.tiktok.com/open_api/v1.3",
    defaultMetrics: [
      "impressions",
      "clicks",
      "cost",
      "conversions",
      "video_views",
      "video_completion_rate",
    ],
    supportedChartTypes: ["line", "bar", "area", "pie"] as ChartType[],
  },
  amazon_ads: {
    name: "Amazon Ads",
    displayName: "아마존 광고",
    color: "#ff9900",
    icon: "📦",
    description: "아마존 스폰서 프로덕트 광고",
    apiEndpoint: "https://advertising-api.amazon.com",
    defaultMetrics: [
      "impressions",
      "clicks",
      "cost",
      "conversions",
      "attributed_sales",
      "acos",
      "roas",
    ],
    supportedChartTypes: ["line", "bar", "area", "pie"] as ChartType[],
  },
} as const;

// 메트릭 설정
export const METRICS_CONFIG = {
  impressions: {
    label: "노출수",
    description: "광고가 표시된 횟수",
    format: "number",
    unit: "회",
    color: "#3b82f6",
    icon: "👁️",
    category: "exposure",
    isRatio: false,
    higherIsBetter: true,
  },
  clicks: {
    label: "클릭수",
    description: "광고를 클릭한 횟수",
    format: "number",
    unit: "회",
    color: "#10b981",
    icon: "👆",
    category: "engagement",
    isRatio: false,
    higherIsBetter: true,
  },
  cost: {
    label: "비용",
    description: "광고에 소요된 총 비용",
    format: "currency",
    unit: "원",
    color: "#f59e0b",
    icon: "💰",
    category: "cost",
    isRatio: false,
    higherIsBetter: false,
  },
  conversions: {
    label: "전환수",
    description: "전환 액션이 발생한 횟수",
    format: "number",
    unit: "회",
    color: "#8b5cf6",
    icon: "🎯",
    category: "conversion",
    isRatio: false,
    higherIsBetter: true,
  },
  ctr: {
    label: "CTR",
    description: "클릭률 (클릭수/노출수)",
    format: "percentage",
    unit: "%",
    color: "#06b6d4",
    icon: "📊",
    category: "efficiency",
    isRatio: true,
    higherIsBetter: true,
  },
  cpc: {
    label: "CPC",
    description: "클릭당 비용 (비용/클릭수)",
    format: "currency",
    unit: "원",
    color: "#f97316",
    icon: "💸",
    category: "cost",
    isRatio: true,
    higherIsBetter: false,
  },
  cpm: {
    label: "CPM",
    description: "천 노출당 비용 (비용/노출수*1000)",
    format: "currency",
    unit: "원",
    color: "#84cc16",
    icon: "📈",
    category: "cost",
    isRatio: true,
    higherIsBetter: false,
  },
  conversionRate: {
    label: "전환율",
    description: "전환율 (전환수/클릭수)",
    format: "percentage",
    unit: "%",
    color: "#ec4899",
    icon: "🔄",
    category: "efficiency",
    isRatio: true,
    higherIsBetter: true,
  },
  costPerConversion: {
    label: "전환당 비용",
    description: "전환 한 건당 비용 (비용/전환수)",
    format: "currency",
    unit: "원",
    color: "#ef4444",
    icon: "💵",
    category: "cost",
    isRatio: true,
    higherIsBetter: false,
  },
  roas: {
    label: "ROAS",
    description: "광고 수익률 (수익/비용)",
    format: "ratio",
    unit: "배",
    color: "#22c55e",
    icon: "📈",
    category: "efficiency",
    isRatio: true,
    higherIsBetter: true,
  },
} as const;

// 날짜 범위 설정
export const DATE_RANGE_CONFIG = {
  LAST_7_DAYS: {
    label: "지난 7일",
    days: 7,
    description: "최근 7일간의 데이터",
  },
  LAST_30_DAYS: {
    label: "지난 30일",
    days: 30,
    description: "최근 30일간의 데이터",
  },
  LAST_90_DAYS: {
    label: "지난 90일",
    days: 90,
    description: "최근 90일간의 데이터",
  },
  CUSTOM: {
    label: "사용자 정의",
    days: 0,
    description: "사용자가 지정한 기간",
  },
} as const;

// 값 포맷팅 함수
export function formatMetricValue(value: number, format: string): string {
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
}

// 메트릭 계산 함수
export function calculateMetrics(
  data: PlatformMetrics,
): Record<string, number> {
  const metrics = {
    impressions: data.impressions,
    clicks: data.clicks,
    cost: data.cost,
    conversions: data.conversions,
    ctr: data.impressions > 0 ? data.clicks / data.impressions : 0,
    cpc: data.clicks > 0 ? data.cost / data.clicks : 0,
    cpm: data.impressions > 0 ? (data.cost / data.impressions) * 1000 : 0,
    conversionRate: data.clicks > 0 ? data.conversions / data.clicks : 0,
    costPerConversion: data.conversions > 0 ? data.cost / data.conversions : 0,
    roas: data.cost > 0 ? (data.conversions * 50000) / data.cost : 0, // 임시 수익값 계산
  };

  return metrics;
}

// 메트릭 비교 함수
export function compareMetrics(
  current: PlatformMetrics,
  previous: PlatformMetrics,
): MetricsComparison {
  const currentCalculated = calculateMetrics(current);
  const previousCalculated = calculateMetrics(previous);

  const percentageChange = Object.keys(currentCalculated).reduce(
    (acc, key) => {
      const currentValue = currentCalculated[key];
      const previousValue = previousCalculated[key];
      const change =
        previousValue > 0
          ? ((currentValue - previousValue) / previousValue) * 100
          : 0;

      acc[key] = change;

      return acc;
    },
    {} as Record<string, number>,
  );

  // 트렌드 결정 (주요 지표들의 평균 변화율로 결정)
  const importantMetrics = ["ctr", "cpc", "conversionRate", "roas"];
  const avgChange =
    importantMetrics.reduce(
      (sum, metric) => sum + (percentageChange[metric] || 0),
      0,
    ) / importantMetrics.length;

  const trend = avgChange > 5 ? "up" : avgChange < -5 ? "down" : "stable";
  const significance =
    Math.abs(avgChange) > 20
      ? "high"
      : Math.abs(avgChange) > 10
        ? "medium"
        : "low";

  return {
    current: {
      platform: "google_ads", // 임시값
      accountId: "temp",
      accountName: "temp",
      campaignId: "temp",
      campaignName: "temp",
      dateRange: "LAST_30_DAYS",
      metrics: current,
      lastUpdated: new Date().toISOString(),
      currency: "KRW",
      timezone: "Asia/Seoul",
    },
    previous: {
      platform: "google_ads", // 임시값
      accountId: "temp",
      accountName: "temp",
      campaignId: "temp",
      campaignName: "temp",
      dateRange: "LAST_30_DAYS",
      metrics: previous,
      lastUpdated: new Date().toISOString(),
      currency: "KRW",
      timezone: "Asia/Seoul",
    },
    percentageChange: {
      impressions: percentageChange.impressions || 0,
      clicks: percentageChange.clicks || 0,
      cost: percentageChange.cost || 0,
      conversions: percentageChange.conversions || 0,
      ctr: percentageChange.ctr || 0,
      cpc: percentageChange.cpc || 0,
      cpm: percentageChange.cpm || 0,
      conversionRate: percentageChange.conversionRate || 0,
      costPerConversion: percentageChange.costPerConversion || 0,
      roas: percentageChange.roas || 0,
    },
    trend,
    significance,
  };
}

// 차트 색상 팔레트
export const CHART_COLORS = {
  primary: ["#3b82f6", "#1d4ed8", "#1e40af", "#1e3a8a", "#172554"],
  success: ["#10b981", "#059669", "#047857", "#065f46", "#064e3b"],
  warning: ["#f59e0b", "#d97706", "#b45309", "#92400e", "#78350f"],
  danger: ["#ef4444", "#dc2626", "#b91c1c", "#991b1b", "#7f1d1d"],
  info: ["#06b6d4", "#0891b2", "#0e7490", "#155e75", "#164e63"],
  purple: ["#8b5cf6", "#7c3aed", "#6d28d9", "#5b21b6", "#4c1d95"],
  pink: ["#ec4899", "#db2777", "#be185d", "#9d174d", "#831843"],
  gradient: [
    "linear-gradient(45deg, #3b82f6, #8b5cf6)",
    "linear-gradient(45deg, #10b981, #059669)",
    "linear-gradient(45deg, #f59e0b, #d97706)",
    "linear-gradient(45deg, #ef4444, #dc2626)",
    "linear-gradient(45deg, #06b6d4, #0891b2)",
  ],
} as const;

// 차트 옵션 생성 함수
export function createChartOption(
  type: ChartType,
  data: unknown[],
  config: Partial<ChartConfig> = {},
  theme: "light" | "dark" = "light",
): ChartConfig {
  const isDark = theme === "dark";
  const textColor = isDark ? "#ffffff" : "#000000";
  const backgroundColor = isDark ? "#18181b" : "#ffffff";
  const gridColor = isDark ? "#3f3f46" : "#e4e4e7";

  const baseOption = {
    backgroundColor,
    textStyle: {
      color: textColor,
    },
    title: {
      text: config.title || "",
      subtext: config.subtitle || "",
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
      show: true,
      trigger: "axis" as "axis" | "item" | undefined,
      backgroundColor: isDark ? "#27272a" : "#ffffff",
      borderColor: isDark ? "#3f3f46" : "#e4e4e7",
      textStyle: {
        color: textColor,
      },
    },
    legend:
      config.legend?.show !== false
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
      top: config.legend?.show !== false ? 100 : 80,
      bottom: 60,
      borderColor: gridColor,
    },
    animation: config.animation !== false,
    animationDuration: 1000,
    animationEasing: "cubicOut",
  };

  if (type === "pie") {
    return {
      ...baseOption,
      type: type,
      title: config.title || "",
      xAxis: {
        type: "category" as const,
        data: [],
        name: "",
      },
      yAxis: {
        type: "value" as const,
        name: "",
      },
      series: [
        {
          name: config.series?.[0]?.name || "데이터",
          type: "pie",
          data: data as { name: string; value: number }[],
        },
      ],
    };
  }

  return {
    ...baseOption,
    type: type,
    title: config.title || "",
    xAxis: {
      type: config.xAxis?.type || "category",
      data: config.xAxis?.data || [],
      name: config.xAxis?.name || "",
    },
    yAxis: {
      type: config.yAxis?.type || "value",
      name: config.yAxis?.name || "",
      min: config.yAxis?.min,
      max: config.yAxis?.max,
    },
    series: config.series || [],
  };
}

// 데이터 검증 함수
export function validateMetricsData(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;

  const requiredFields = ["impressions", "clicks", "cost", "conversions"];

  return requiredFields.every(
    (field) =>
      typeof (data as Record<string, unknown>)[field] === "number" &&
      Number((data as Record<string, unknown>)[field]) >= 0,
  );
}

// 데이터 정규화 함수
export function normalizeMetricsData(
  data: Record<string, unknown>[],
): Record<string, unknown>[] {
  if (!Array.isArray(data)) return [];

  return data.map((item) => ({
    ...item,
    impressions: Math.max(0, Number(item.impressions) || 0),
    clicks: Math.max(0, Number(item.clicks) || 0),
    cost: Math.max(0, Number(item.cost) || 0),
    conversions: Math.max(0, Number(item.conversions) || 0),
    ctr: Math.max(0, Number(item.ctr) || 0),
    cpc: Math.max(0, Number(item.cpc) || 0),
    cpm: Math.max(0, Number(item.cpm) || 0),
    conversionRate: Math.max(0, Number(item.conversionRate) || 0),
    costPerConversion: Math.max(0, Number(item.costPerConversion) || 0),
    roas: Math.max(0, Number(item.roas) || 0),
  }));
}

// 성과 등급 계산 함수
export function calculatePerformanceGrade(metrics: PlatformMetrics): {
  grade: "A" | "B" | "C" | "D" | "F";
  score: number;
  recommendations: string[];
} {
  const calculated = calculateMetrics(metrics);
  let score = 0;
  const recommendations: string[] = [];

  // CTR 점수 (0-25점)
  if (calculated.ctr > 0.03) score += 25;
  else if (calculated.ctr > 0.02) score += 20;
  else if (calculated.ctr > 0.01) score += 15;
  else if (calculated.ctr > 0.005) score += 10;
  else {
    score += 5;
    recommendations.push("CTR이 낮습니다. 광고 소재를 개선해보세요.");
  }

  // 전환율 점수 (0-25점)
  if (calculated.conversionRate > 0.05) score += 25;
  else if (calculated.conversionRate > 0.03) score += 20;
  else if (calculated.conversionRate > 0.02) score += 15;
  else if (calculated.conversionRate > 0.01) score += 10;
  else {
    score += 5;
    recommendations.push("전환율이 낮습니다. 랜딩 페이지를 최적화해보세요.");
  }

  // ROAS 점수 (0-25점)
  if (calculated.roas > 4) score += 25;
  else if (calculated.roas > 3) score += 20;
  else if (calculated.roas > 2) score += 15;
  else if (calculated.roas > 1) score += 10;
  else {
    score += 5;
    recommendations.push("ROAS가 낮습니다. 타겟팅을 재검토해보세요.");
  }

  // 비용 효율성 점수 (0-25점)
  const avgCpc = calculated.cpc;

  if (avgCpc < 500) score += 25;
  else if (avgCpc < 1000) score += 20;
  else if (avgCpc < 2000) score += 15;
  else if (avgCpc < 3000) score += 10;
  else {
    score += 5;
    recommendations.push("CPC가 높습니다. 입찰 전략을 조정해보세요.");
  }

  // 등급 결정
  let grade: "A" | "B" | "C" | "D" | "F";

  if (score >= 90) grade = "A";
  else if (score >= 80) grade = "B";
  else if (score >= 70) grade = "C";
  else if (score >= 60) grade = "D";
  else grade = "F";

  return { grade, score, recommendations };
}

// 시계열 데이터 생성 함수
export function generateTimeSeriesData(
  startDate: Date,
  endDate: Date,
  baseMetrics: PlatformMetrics,
  trend: "up" | "down" | "stable" = "stable",
): Array<PlatformMetrics & { date: string }> {
  const data: Array<PlatformMetrics & { date: string }> = [];
  const days = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const progress = i / days;

    let multiplier = 1;

    if (trend === "up") {
      multiplier = 1 + progress * 0.5; // 50% 증가
    } else if (trend === "down") {
      multiplier = 1 - progress * 0.3; // 30% 감소
    }

    // 약간의 랜덤 노이즈 추가
    const noise = 0.9 + Math.random() * 0.2;

    const dayData = {
      impressions: Math.floor(baseMetrics.impressions * multiplier * noise),
      clicks: Math.floor(baseMetrics.clicks * multiplier * noise),
      cost: Math.floor(baseMetrics.cost * multiplier * noise),
      conversions: Math.floor(baseMetrics.conversions * multiplier * noise),
      ctr: baseMetrics.ctr * multiplier * noise,
      cpc: baseMetrics.cpc * (1 / multiplier) * noise,
      cpm: baseMetrics.cpm * (1 / multiplier) * noise,
      conversionRate: baseMetrics.conversionRate * multiplier * noise,
      costPerConversion:
        baseMetrics.costPerConversion * (1 / multiplier) * noise,
      roas: baseMetrics.roas * multiplier * noise,
      date: date.toISOString().split("T")[0],
    };

    data.push(dayData as PlatformMetrics & { date: string });
  }

  return data;
}

// 성과 인사이트 생성 함수
export function generatePerformanceInsights(
  data: AggregatedMetrics,
  comparison?: MetricsComparison,
): Array<{
  type: "success" | "warning" | "danger" | "info";
  title: string;
  message: string;
  recommendation: string;
  metric: string;
  value: number;
}> {
  const insights: Array<{
    type: "success" | "warning" | "danger" | "info";
    title: string;
    message: string;
    recommendation: string;
    metric: string;
    value: number;
  }> = [];
  const calculated = calculateMetrics(
    data.dataPoints[0]?.metrics || {
      impressions: 0,
      clicks: 0,
      cost: 0,
      conversions: 0,
      ctr: 0,
      cpc: 0,
      cpm: 0,
      conversionRate: 0,
      costPerConversion: 0,
      roas: 0,
      date: "",
    },
  );

  // CTR 분석
  if (calculated.ctr > 0.03) {
    insights.push({
      type: "success",
      title: "높은 클릭률",
      message: `CTR ${(calculated.ctr * 100).toFixed(2)}%로 우수한 성과를 보이고 있습니다.`,
      recommendation:
        "현재 광고 소재와 타겟팅 전략을 다른 캠페인에도 적용해보세요.",
      metric: "ctr",
      value: calculated.ctr,
    });
  } else if (calculated.ctr < 0.01) {
    insights.push({
      type: "warning",
      title: "낮은 클릭률",
      message: `CTR ${(calculated.ctr * 100).toFixed(2)}%로 개선이 필요합니다.`,
      recommendation: "광고 소재를 개선하고 타겟팅을 재검토해보세요.",
      metric: "ctr",
      value: calculated.ctr,
    });
  }

  // ROAS 분석
  if (calculated.roas > 4) {
    insights.push({
      type: "success",
      title: "우수한 수익률",
      message: `ROAS ${calculated.roas.toFixed(2)}로 매우 효율적인 광고 운영을 하고 있습니다.`,
      recommendation: "예산을 증액하여 성과를 확대하는 것을 고려해보세요.",
      metric: "roas",
      value: calculated.roas,
    });
  } else if (calculated.roas < 2) {
    insights.push({
      type: "danger",
      title: "낮은 수익률",
      message: `ROAS ${calculated.roas.toFixed(2)}로 수익성이 낮습니다.`,
      recommendation: "입찰 전략을 재검토하고 고전환 키워드에 집중하세요.",
      metric: "roas",
      value: calculated.roas,
    });
  }

  // 비용 효율성 분석
  if (calculated.cpc > 2000) {
    insights.push({
      type: "warning",
      title: "높은 클릭당 비용",
      message: `CPC ₩${calculated.cpc.toLocaleString()}로 비용 효율성이 떨어집니다.`,
      recommendation: "키워드 품질점수를 개선하고 입찰 전략을 조정해보세요.",
      metric: "cpc",
      value: calculated.cpc,
    });
  }

  // 전환율 분석
  if (calculated.conversionRate > 0.05) {
    insights.push({
      type: "success",
      title: "높은 전환율",
      message: `전환율 ${(calculated.conversionRate * 100).toFixed(2)}%로 우수한 성과를 보이고 있습니다.`,
      recommendation: "현재 랜딩 페이지 경험을 다른 캠페인에도 적용해보세요.",
      metric: "conversionRate",
      value: calculated.conversionRate,
    });
  } else if (calculated.conversionRate < 0.01) {
    insights.push({
      type: "warning",
      title: "낮은 전환율",
      message: `전환율 ${(calculated.conversionRate * 100).toFixed(2)}%로 개선이 필요합니다.`,
      recommendation: "랜딩 페이지를 최적화하고 전환 흐름을 점검해보세요.",
      metric: "conversionRate",
      value: calculated.conversionRate,
    });
  }

  // 트렌드 분석 (비교 데이터가 있는 경우)
  if (comparison) {
    const trendInsights: Array<{
      type: "success" | "warning" | "danger" | "info";
      title: string;
      message: string;
      recommendation: string;
      metric: string;
      value: number;
    }> = Object.entries(comparison.percentageChange)
      .map(([metric, change]) => {
        const config = METRICS_CONFIG[metric as keyof typeof METRICS_CONFIG];

        if (!config) return null;

        if (Math.abs(change) > 10) {
          return {
            type: (change > 0
              ? config.higherIsBetter
                ? "success"
                : "warning"
              : config.higherIsBetter
                ? "warning"
                : "success") as "success" | "warning" | "danger" | "info",
            title: `${config.label} ${change > 0 ? "증가" : "감소"}`,
            message: `${config.label}이 ${Math.abs(change).toFixed(1)}% ${change > 0 ? "증가" : "감소"}했습니다.`,
            recommendation:
              change > 0
                ? "긍정적인 트렌드를 유지하세요."
                : "원인을 분석하고 개선 방안을 수립하세요.",
            metric,
            value: change,
          };
        }

        return null;
      })
      .filter(Boolean) as Array<{
      type: "success" | "warning" | "danger" | "info";
      title: string;
      message: string;
      recommendation: string;
      metric: string;
      value: number;
    }>;

    insights.push(...trendInsights);
  }

  return insights;
}

// 데이터 내보내기 함수
export function exportToCSV(
  data: Record<string, unknown>[],
  filename: string,
): void {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers.map((header) => `"${String(row[header])}"`).join(","),
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 로컬 스토리지 관리
export const storage = {
  set: (key: string, value: unknown): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      log.error("Failed to save to localStorage:", error);
    }
  },
  get: (key: string): unknown => {
    try {
      const item = localStorage.getItem(key);

      return item ? JSON.parse(item) : null;
    } catch (error) {
      log.error("Failed to read from localStorage:", error);

      return null;
    }
  },
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      log.error("Failed to remove from localStorage:", error);
    }
  },
  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      log.error("Failed to clear localStorage:", error);
    }
  },
};

// 디바운스 함수
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// 스로틀 함수
export function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}
