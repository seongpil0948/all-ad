export interface GoogleAdsCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  developerToken: string;
  accessToken?: string; // Optional access token
  loginCustomerId?: string; // MCC 계정 ID
  isMcc?: boolean; // MCC 계정 여부
}

// Type alias for backward compatibility
export type GoogleAdsApiCredentials = GoogleAdsCredentials;

export interface GoogleAdsAccount {
  id: string;
  name: string;
  customerId: string;
  credentials: GoogleAdsCredentials;
  isManager: boolean;
  parentId?: string;
  currencyCode?: string;
  timeZone?: string;
  status?: "ENABLED" | "PAUSED" | "REMOVED";
}

export interface GoogleAdsCampaign {
  id: string;
  name: string;
  status: "ENABLED" | "PAUSED" | "REMOVED";
  budgetAmountMicros?: number;
  impressions?: number;
  clicks?: number;
  costMicros?: number;
}

export interface CampaignStatusUpdate {
  campaignId: string;
  status: "ENABLED" | "PAUSED" | "REMOVED";
}

export interface GoogleAdsMetrics {
  impressions: number;
  clicks: number;
  costMicros: number;
  conversions?: number;
  conversionValue?: number;
  ctr?: number;
  averageCpc?: number;
  averageCpm?: number;
}

export interface GoogleAdsClientAccount {
  customer_client: {
    id: string;
    descriptive_name: string;
    currency_code: string;
    time_zone: string;
    manager: boolean;
    status: string;
  };
}

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

export interface SyncConfig {
  enabled: boolean;
  interval: number;
  batchSize: number;
  retryAttempts: number;
}

export interface SyncError {
  timestamp: Date;
  accountId: string;
  error: string;
  details?: any;
}

export interface GoogleAdsQuery {
  query: string;
  customerId: string;
  pageSize?: number;
  pageToken?: string;
}

export interface GoogleAdsApiResponse<T = any> {
  results: T[];
  fieldMask?: string;
  totalResultsCount?: number;
  nextPageToken?: string;
}

export interface GoogleAdsError {
  code: number;
  message: string;
  details?: any;
}

export interface BatchOperation<T = any> {
  create?: T;
  update?: T;
  remove?: string;
  updateMask?: string[];
}

export interface ReportQuery {
  entity: string;
  attributes: string[];
  metrics: string[];
  segments?: string[];
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  filters?: string[];
  orderBy?: string[];
  limit?: number;
}

export interface CampaignBudget {
  campaignId: string;
  budgetAmountMicros: number;
  deliveryMethod?: "STANDARD" | "ACCELERATED";
}

export interface ChangeEvent {
  customerId: string;
  changeDateTime: string;
  changeResourceType: string;
  changeResourceId: string;
  changeType: "ADDED" | "CHANGED" | "REMOVED";
  oldResource?: any;
  newResource?: any;
}

export interface QueueJob<T = any> {
  id: string;
  type: string;
  payload: T;
  status: "pending" | "processing" | "completed" | "failed";
  attempts: number;
  createdAt: Date;
  processedAt?: Date;
  error?: string;
}

export interface SchedulerConfig {
  jobType: string;
  schedule: string; // cron expression
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

export interface SyncResult {
  accountId: string;
  success: boolean;
  recordsProcessed: number;
  errors: SyncError[];
  startTime: Date;
  endTime: Date;
}
