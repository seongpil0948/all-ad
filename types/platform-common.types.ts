// Common types for all platform services
import type { Json } from "@/types/supabase.types";
import type { PlatformType } from "@/types";
import type { PlatformCredentials } from "@/services/platforms/platform-service.interface";

// Common platform credential interface
export interface PlatformCredentialData {
  id?: string;
  teamId?: string;
  accountName?: string;
  advertiser_id?: string;
  advertiser_ids?: string[];
  account_info?: {
    id?: string;
    name?: string;
    advertiser_id?: string;
    advertiser_name?: string;
  };
  [key: string]: unknown;
}

// Common campaign transformation result
export interface TransformedCampaign {
  external_id: string;
  name: string;
  status: "active" | "paused";
  budget: number;
  platform: PlatformType;
  platform_credential_id: string;
  raw_data: Json;
}

// Common API response structure
export interface PlatformApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: number | string;
  message?: string;
}

// Common pagination info
export interface PaginationInfo {
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
}

// Common list response
export interface PlatformListResponse<T> {
  items: T[];
  pagination: PaginationInfo;
}

// Common error response
export interface PlatformErrorResponse {
  code: number | string;
  message: string;
  details?: unknown;
}

// Common OAuth token response
export interface PlatformTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
}

// Common account info
export interface PlatformAccountInfo {
  id: string;
  name: string;
  currency?: string;
  timezone?: string;
  status?: string;
  balance?: number;
}

// Common metrics
export interface PlatformMetricsData {
  date: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions?: number;
  ctr?: number;
  cpc?: number;
  cpm?: number;
  roas?: number;
}

// Platform credentials extension interfaces
export interface ExtendedPlatformCredentials extends PlatformCredentials {
  id?: string;
  teamId?: string;
  accountName?: string;
}

// Common API error codes
export enum PlatformApiErrorCode {
  // Auth errors
  INVALID_TOKEN = "INVALID_TOKEN",
  EXPIRED_TOKEN = "EXPIRED_TOKEN",
  MISSING_TOKEN = "MISSING_TOKEN",
  INVALID_REFRESH_TOKEN = "INVALID_REFRESH_TOKEN",

  // Rate limit errors
  RATE_LIMIT = "RATE_LIMIT",
  QUOTA_EXCEEDED = "QUOTA_EXCEEDED",

  // API errors
  INVALID_REQUEST = "INVALID_REQUEST",
  NOT_FOUND = "NOT_FOUND",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",

  // Network errors
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT = "TIMEOUT",

  // Business errors
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
  INVALID_CAMPAIGN = "INVALID_CAMPAIGN",
  PERMISSION_DENIED = "PERMISSION_DENIED",
}

// Common retry configuration
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

// Default retry configuration
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
};
