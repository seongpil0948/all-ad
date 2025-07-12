// 광고 플랫폼별 메트릭스 데이터 타입 정의
// Google Ads, Meta Ads, TikTok Ads, Amazon Ads 등의 메트릭스를 통합 관리

export type AdPlatform =
  | "google_ads"
  | "meta_ads"
  | "tiktok_ads"
  | "amazon_ads";

export type DateRange =
  | "LAST_7_DAYS"
  | "LAST_30_DAYS"
  | "LAST_90_DAYS"
  | "CUSTOM";

export type ChartType =
  | "line"
  | "bar"
  | "pie"
  | "area"
  | "scatter"
  | "funnel"
  | "gauge";

// 기본 메트릭스 인터페이스
export interface BaseMetrics {
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  ctr: number; // Click-through rate
  cpc: number; // Cost per click
  cpm: number; // Cost per mille
  conversionRate: number;
  costPerConversion: number;
  roas: number; // Return on ad spend
  date: string;
}

// Google Ads 전용 메트릭스 (Google Ads API 문서 기반)
export interface GoogleAdsMetrics extends BaseMetrics {
  // 기본 성과 지표
  allConversions: number;
  allConversionsValue: number;
  averageCpc: number;
  averageCpm: number;
  averageCpv: number;
  averageOrderValue: number;

  // 품질 지표
  qualityScore: number;
  historicalQualityScore: number;
  searchImpressionShare: number;
  searchRankLostImpressionShare: number;
  searchBudgetLostImpressionShare: number;

  // 위치 지표
  topImpressionPercentage: number;
  absoluteTopImpressionPercentage: number;

  // 상호작용 지표
  interactions: number;
  interactionRate: number;
  engagements: number;
  engagementRate: number;

  // 전환 지표
  viewThroughConversions: number;
  crossDeviceConversions: number;
  newCustomerLifetimeValue: number;

  // 비디오 지표 (YouTube Ads)
  videoViewRate?: number;
  videoViews?: number;
  videoQuartileP25Rate?: number;
  videoQuartileP50Rate?: number;
  videoQuartileP75Rate?: number;
  videoQuartileP100Rate?: number;

  // 쇼핑 지표
  orders?: number;
  averageCartSize?: number;
  costOfGoodsSold?: number;
  grossProfitMargin?: number;
  revenue?: number;
  unitsSold?: number;

  // 로컬 지표
  phoneImpressions?: number;
  phoneCalls?: number;
  storeVisits?: number;

  // 앱 지표
  appInstalls?: number;
  appPostInstallConversions?: number;

  // 검색 지표
  searchTerms?: string[];
  searchVolume?: number;

  // 경쟁 지표
  benchmarkCtr?: number;
  benchmarkAverageMaxCpc?: number;

  // 브랜드 안전성
  brandSafetySuitability?: string;

  // 자동화 지표
  optimizationScoreUplift?: number;

  // 위치 기반 지표
  locationName?: string;
  locationRadius?: number;

  // 기기별 지표
  deviceType?: "DESKTOP" | "MOBILE" | "TABLET";

  // 시간대별 지표
  hourOfDay?: number;
  dayOfWeek?: string;

  // 오디언스 지표
  audienceType?: string;
  demographicAge?: string;
  demographicGender?: string;

  // 광고 확장 지표
  extensionType?: string;
  extensionClicks?: number;

  // 스마트 캠페인 지표
  smartCampaignSearchTerms?: string[];

  // 성과 최대화 캠페인 지표
  assetPerformanceLabel?: "BEST" | "GOOD" | "LOW" | "LEARNING" | "UNRATED";

  // 로컬 서비스 지표
  localServicesLeads?: number;
  localServicesLeadCost?: number;

  // 디스플레이 지표
  activeViewImpressions?: number;
  activeViewMeasurability?: number;
  activeViewViewability?: number;

  // 지리적 지표
  geoTargetType?: string;
  geoTargetName?: string;

  // 키워드 지표
  keywordText?: string;
  keywordMatchType?: "EXACT" | "PHRASE" | "BROAD";

  // 광고 그룹 지표
  adGroupName?: string;
  adGroupType?: string;

  // 캠페인 지표
  campaignName?: string;
  campaignType?: string;
  campaignStatus?: string;

  // 예산 지표
  budgetAmount?: number;
  budgetUtilization?: number;

  // 입찰 지표
  biddingStrategy?: string;
  targetCpa?: number;
  targetRoas?: number;

  // 고객 지표
  customerDescriptiveName?: string;
  customerId?: string;

  // 네트워크 지표
  networkType?: "SEARCH" | "DISPLAY" | "YOUTUBE" | "SHOPPING";

  // 플랫폼 지표
  platform?: string;

  // 맞춤 지표
  customMetrics?: Record<string, number | string>;
}

// Meta Ads 전용 메트릭스
export interface MetaAdsMetrics extends BaseMetrics {
  reach: number;
  frequency: number;
  socialSpend: number;
  websiteClicks: number;
  linkClicks: number;
  postEngagement: number;
  pageEngagement: number;
  postShares: number;
  postReactions: number;
  postComments: number;
  videoPlays: number;
  videoP25Watched: number;
  videoP50Watched: number;
  videoP75Watched: number;
  videoP100Watched: number;
  leadGeneration: number;
  messaging: number;
  appInstalls: number;
  mobileAppPurchases: number;

  // 오디언스 지표
  audienceSize?: number;
  audienceReach?: number;

  // 지리적 지표
  locationName?: string;

  // 기기별 지표
  deviceType?: "desktop" | "mobile" | "tablet";

  // 배치 지표
  placementType?: "feed" | "story" | "reel" | "video" | "audience_network";

  // 연령/성별 지표
  age?: string;
  gender?: string;

  // 맞춤 지표
  customMetrics?: Record<string, number | string>;
}

// TikTok Ads 전용 메트릭스 (예상)
export interface TikTokAdsMetrics extends BaseMetrics {
  videoViews: number;
  videoViewsP25: number;
  videoViewsP50: number;
  videoViewsP75: number;
  videoViewsP100: number;
  profileVisits: number;
  follows: number;
  likes: number;
  comments: number;
  shares: number;
  appInstalls: number;
  appEvents: number;

  // 맞춤 지표
  customMetrics?: Record<string, number | string>;
}

// Amazon Ads 전용 메트릭스 (예상)
export interface AmazonAdsMetrics extends BaseMetrics {
  attributedSales: number;
  attributedUnitsOrdered: number;
  attributedConversions: number;
  acos: number; // Advertising Cost of Sales
  dpv: number; // Detail Page Views

  // 맞춤 지표
  customMetrics?: Record<string, number | string>;
}

// 통합 메트릭스 타입
export type PlatformMetrics =
  | GoogleAdsMetrics
  | MetaAdsMetrics
  | TikTokAdsMetrics
  | AmazonAdsMetrics;

// 메트릭스 데이터 구조
export interface MetricsData {
  platform: AdPlatform;
  accountId: string;
  accountName: string;
  campaignId: string;
  campaignName: string;
  adGroupId?: string;
  adGroupName?: string;
  adId?: string;
  adName?: string;
  dateRange: DateRange;
  customDateRange?: {
    startDate: string;
    endDate: string;
  };
  metrics: PlatformMetrics;
  lastUpdated: string;
  currency: string;
  timezone: string;
}

// 집계된 메트릭스 데이터
export interface AggregatedMetrics {
  platform: AdPlatform;
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
  dateRange: DateRange;
  customDateRange?: {
    startDate: string;
    endDate: string;
  };
  lastUpdated: string;
}

// 다중 플랫폼 비교 데이터
export interface MultiPlatformMetrics {
  platforms: AdPlatform[];
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
  platformBreakdown: AggregatedMetrics[];
  dateRange: DateRange;
  customDateRange?: {
    startDate: string;
    endDate: string;
  };
  lastUpdated: string;
}

// 차트 설정 인터페이스
export interface ChartConfig {
  type: ChartType;
  title: string;
  subtitle?: string;
  xAxis: {
    type: "category" | "value" | "time";
    data?: string[];
    name?: string;
  };
  yAxis: {
    type: "value" | "category";
    name?: string;
    min?: number;
    max?: number;
  };
  series: {
    name: string;
    data: number[] | { name: string; value: number }[];
    type: ChartType;
    color?: string;
    smooth?: boolean;
    area?: boolean;
  }[];
  legend?: {
    show: boolean;
    position?: "top" | "bottom" | "left" | "right";
  };
  tooltip?: {
    show: boolean;
    trigger?: "item" | "axis";
    formatter?: string;
  };
  animation?: boolean;
  responsive?: boolean;
  theme?: "light" | "dark";
}

// 대시보드 필터 옵션
export interface DashboardFilters {
  platforms: AdPlatform[];
  dateRange: DateRange;
  customDateRange?: {
    startDate: string;
    endDate: string;
  };
  accounts: string[];
  campaigns: string[];
  adGroups?: string[];
  ads?: string[];
  metrics: string[];
  groupBy?: "platform" | "account" | "campaign" | "adGroup" | "ad" | "date";
  sortBy?: {
    field: string;
    direction: "asc" | "desc";
  };
  limit?: number;
  offset?: number;
}

// API 응답 타입
export interface MetricsApiResponse {
  success: boolean;
  data?: MetricsData[] | AggregatedMetrics | MultiPlatformMetrics;
  error?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  metadata?: {
    lastUpdated: string;
    dataQuality: "high" | "medium" | "low";
    samplingRate?: number;
    estimatedAccuracy?: number;
  };
}

// 실시간 메트릭스 업데이트 타입
export interface RealtimeMetricsUpdate {
  platform: AdPlatform;
  accountId: string;
  campaignId: string;
  timestamp: string;
  metrics: Partial<PlatformMetrics>;
  changeType: "update" | "new" | "delete";
}

// 메트릭스 비교 타입
export interface MetricsComparison {
  current: MetricsData;
  previous: MetricsData;
  percentageChange: {
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
    ctr: number;
    cpc: number;
    cpm: number;
    conversionRate: number;
    costPerConversion: number;
    roas: number;
  };
  trend: "up" | "down" | "stable";
  significance: "high" | "medium" | "low";
}

// 예측 메트릭스 타입
export interface PredictiveMetrics {
  platform: AdPlatform;
  campaignId: string;
  forecastPeriod: {
    startDate: string;
    endDate: string;
  };
  predictedMetrics: {
    impressions: {
      value: number;
      confidence: number;
      range: { min: number; max: number };
    };
    clicks: {
      value: number;
      confidence: number;
      range: { min: number; max: number };
    };
    cost: {
      value: number;
      confidence: number;
      range: { min: number; max: number };
    };
    conversions: {
      value: number;
      confidence: number;
      range: { min: number; max: number };
    };
  };
  modelAccuracy: number;
  lastTrainingDate: string;
}

// 경고 및 알림 타입
export interface MetricsAlert {
  id: string;
  platform: AdPlatform;
  accountId: string;
  campaignId: string;
  alertType:
    | "performance_drop"
    | "budget_exceeded"
    | "conversion_spike"
    | "cpc_increase"
    | "custom";
  severity: "critical" | "warning" | "info";
  message: string;
  threshold: {
    metric: string;
    operator: ">" | "<" | "=" | ">=" | "<=";
    value: number;
  };
  currentValue: number;
  triggeredAt: string;
  acknowledged: boolean;
  resolvedAt?: string;
}

// 메트릭스 내보내기 타입
export interface MetricsExport {
  format: "csv" | "xlsx" | "json" | "pdf";
  data: MetricsData[] | AggregatedMetrics | MultiPlatformMetrics;
  filters: DashboardFilters;
  columns: string[];
  filename: string;
  generatedAt: string;
  expiresAt: string;
}

// 메트릭스 캐시 타입
export interface MetricsCache {
  key: string;
  data: MetricsData[] | AggregatedMetrics | MultiPlatformMetrics;
  expiresAt: string;
  lastAccessed: string;
  hitCount: number;
  platform: AdPlatform;
  filters: DashboardFilters;
}

// 메트릭스 집계 설정
export interface AggregationConfig {
  timeGranularity: "hour" | "day" | "week" | "month" | "quarter" | "year";
  groupBy: ("platform" | "account" | "campaign" | "adGroup" | "ad")[];
  metrics: string[];
  calculations: ("sum" | "avg" | "min" | "max" | "count")[];
  filters: DashboardFilters;
}

// 메트릭스 품질 점수
export interface MetricsQuality {
  platform: AdPlatform;
  accountId: string;
  qualityScore: number; // 0-100
  issues: {
    type: "missing_data" | "stale_data" | "inconsistent_data" | "api_error";
    severity: "critical" | "warning" | "info";
    message: string;
    affectedMetrics: string[];
    detectedAt: string;
  }[];
  lastChecked: string;
  dataCompleteness: number; // 0-100
  dataFreshness: number; // 0-100
  dataAccuracy: number; // 0-100
}
