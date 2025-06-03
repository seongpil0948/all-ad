// Google Ads API 타입 정의

// OAuth 2.0 인증 관련 타입
export interface GoogleAdsApiCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken?: string; // Optional as we handle refresh internally
  accessToken?: string; // For direct token usage
  developerToken: string;
  loginCustomerId?: string; // MCC 계정 ID
}

export interface GoogleAdsAccount {
  id: string;
  name: string;
  customerId: string;
  credentials: GoogleAdsApiCredentials;
  isManager: boolean;
  parentId?: string;
}

// 캠페인 관련 타입
export interface GoogleAdsCampaign {
  id: string;
  name: string;
  status: "ENABLED" | "PAUSED" | "REMOVED";
  budgetAmountMicros: number;
  type: string;
  startDate?: string;
  endDate?: string;
  metrics?: GoogleAdsMetrics;
}

export interface GoogleAdsMetrics {
  impressions: number;
  clicks: number;
  costMicros: number;
  conversions: number;
  conversionValue: number;
  ctr: number;
  averageCpc: number;
  averageCpm: number;
  date?: string;
}

// 캠페인 상태 업데이트 타입
export interface CampaignStatusUpdate {
  campaignId: string;
  status: "ENABLED" | "PAUSED" | "REMOVED";
}

// 라벨 관련 타입
export interface GoogleAdsLabel {
  id: string;
  name: string;
  description?: string;
  backgroundColor?: string;
}

export interface CampaignLabelAssignment {
  campaignId: string;
  labelId: string;
}

// 동기화 관련 타입
export interface SyncConfig {
  accountId: string;
  syncType: "FULL" | "INCREMENTAL";
  timestamp: string;
  lastSyncAt?: string;
}

export interface SyncResult {
  accountId: string;
  syncType: "FULL" | "INCREMENTAL";
  recordsProcessed: number;
  successCount: number;
  errorCount: number;
  errors?: SyncError[];
  completedAt: string;
}

export interface SyncError {
  campaignId?: string;
  error: string;
  timestamp: string;
}

// 쿼리 관련 타입
export interface GoogleAdsQuery {
  query: string;
  customerId: string;
  pageSize?: number;
  pageToken?: string;
}

// API 응답 타입
export interface GoogleAdsApiResponse<T> {
  results: T[];
  nextPageToken?: string;
  totalResultsCount?: number;
}

// 에러 타입
export interface GoogleAdsError {
  code: string;
  message: string;
  details?: any;
}

// 배치 작업 타입
export interface BatchOperation {
  entity:
    | "campaign"
    | "ad_group"
    | "ad"
    | "keyword"
    | "label"
    | "campaign_label";
  operation: "create" | "update" | "remove";
  resource: any;
  updateMask?: {
    paths: string[];
  };
}

// 리포트 관련 타입
export interface ReportQuery {
  customerId: string;
  query: string;
  startDate: string;
  endDate: string;
  metrics?: string[];
  dimensions?: string[];
  orderBy?: string;
  limit?: number;
}

// 예산 관련 타입
export interface CampaignBudget {
  id: string;
  name: string;
  amountMicros: number;
  deliveryMethod: "STANDARD" | "ACCELERATED";
  explicitlyShared: boolean;
}

// 변경 이력 관련 타입
export interface ChangeEvent {
  changeDateTime: string;
  userEmail: string;
  changeResourceType: string;
  changeResourceId: string;
  changeResourceName: string;
  clientType: string;
  oldResource?: any;
  newResource?: any;
  resourceChangeOperation: string;
  changedFields: string[];
}

// 큐 작업 타입
export interface QueueJob {
  id: string;
  type: "sync-account" | "update-campaigns" | "fetch-metrics";
  data: any;
  priority: number;
  attempts: number;
  createdAt: string;
  processedAt?: string;
  failedAt?: string;
  error?: string;
}

// 스케줄러 설정 타입
export interface SchedulerConfig {
  incrementalSyncCron: string; // 예: '0 * * * *' (매시간)
  fullSyncCron: string; // 예: '0 2 * * *' (매일 새벽 2시)
  enabled: boolean;
  timezone: string;
}
