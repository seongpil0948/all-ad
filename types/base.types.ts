// Base types used across the application

// Platform types aligned with database enum
export type PlatformType =
  | "facebook"
  | "google"
  | "kakao"
  | "naver"
  | "coupang"
  | "amazon";

// Map legacy platform names to current ones
export const PLATFORM_MAPPING = {
  meta: "facebook",
  facebook: "facebook",
  google: "google",
  kakao: "kakao",
  naver: "naver",
  coupang: "coupang",
  amazon: "amazon",
} as const;

// Campaign status types
export type CampaignStatus = "active" | "paused" | "removed";

// Budget types
export type BudgetType = "daily" | "lifetime";

// Common date range type
export interface DateRange {
  startDate: Date | string;
  endDate: Date | string;
}

// Base sync result type
export interface BaseSyncResult {
  success: boolean;
  message?: string;
  error?: string;
  timestamp: Date;
}

// Common error type
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}
