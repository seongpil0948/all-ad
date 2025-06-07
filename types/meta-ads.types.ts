// Meta/Facebook Ads API 타입 정의

// OAuth 2.0 인증 관련 타입
export interface MetaAdsApiCredentials {
  appId: string;
  appSecret: string;
  accessToken: string;
  businessId?: string;
}

// 계정 관련 타입
export interface MetaAdsAccount {
  id: string;
  name: string;
  status: number;
  currency: string;
  timezone: string;
  accountId?: string;
  businessId?: string;
}

// Meta API raw response type
export interface MetaAdsAccountRaw {
  id: string;
  name: string;
  account_status: number;
  currency: string;
  timezone_name: string;
}

// 캠페인 관련 타입
export interface MetaAdsCampaign {
  id: string;
  name: string;
  status: "ACTIVE" | "PAUSED" | "DELETED" | "ARCHIVED";
  objective: string;
  dailyBudget?: number;
  lifetimeBudget?: number;
  createdTime?: string;
  updatedTime?: string;
  metrics?: MetaAdsMetrics;
}

// Meta API raw campaign response type
export interface MetaAdsCampaignRaw {
  id: string;
  name: string;
  status: string;
  objective?: string;
  daily_budget?: string;
  lifetime_budget?: string;
}

// 메트릭 관련 타입
export interface MetaAdsMetrics {
  impressions: number;
  clicks: number;
  spend: number;
  reach?: number;
  frequency?: number;
  ctr?: number;
  cpc?: number;
  cpm?: number;
  conversions?: number;
  conversionValue?: number;
  date?: string;
}

// 배치 업데이트 타입
export interface MetaCampaignBatchUpdate {
  campaignId: string;
  status: "ACTIVE" | "PAUSED";
}

// API 에러 타입
export interface MetaAdsError {
  message: string;
  type: string;
  code: number;
  error_subcode?: number;
  fbtrace_id?: string;
}

// API 응답 타입
export interface MetaAdsApiResponse<T> {
  data?: T[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
    previous?: string;
  };
  error?: MetaAdsError;
}

// 토큰 교환 응답 타입
export interface MetaTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

// 라벨 관련 타입
export interface MetaAdsLabel {
  id: string;
  name: string;
  account?: MetaAdsAccount;
}

// 광고 세트 타입
export interface MetaAdsAdSet {
  id: string;
  name: string;
  campaignId: string;
  status: string;
  dailyBudget?: number;
  lifetimeBudget?: number;
  startTime?: string;
  endTime?: string;
}

// 광고 타입
export interface MetaAd {
  id: string;
  name: string;
  adsetId: string;
  status: string;
  creative?: MetaAdCreative;
}

// 크리에이티브 타입
export interface MetaAdCreative {
  id: string;
  name: string;
  title?: string;
  body?: string;
  imageUrl?: string;
  videoUrl?: string;
  callToAction?: string;
}

// 인사이트 요청 타입
export interface MetaInsightsRequest {
  accountId: string;
  level?: "account" | "campaign" | "adset" | "ad";
  datePreset?: string;
  timeRange?: {
    since: string;
    until: string;
  };
  fields?: string[];
  breakdowns?: string[];
}

// 배치 작업 결과 타입
export interface MetaBatchResult {
  id: string;
  success: boolean;
  error?: MetaAdsError;
}

// 웹훅 타입
export interface MetaWebhookEvent {
  object: string;
  entry: Array<{
    id: string;
    time: number;
    changes: Array<{
      field: string;
      value: unknown;
    }>;
  }>;
}
