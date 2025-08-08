// Platform service related types
import type { Json } from "@/types/supabase.types";

// Common platform types
export type PlatformType =
  | "google_ads"
  | "facebook_ads"
  | "tiktok_ads"
  | "amazon_ads"
  | "kakao_ads"
  | "naver_ads"
  | "coupang_ads";

// Platform credentials interface
export interface PlatformCredentials {
  platform: PlatformType;
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  account_id?: string;
  advertiser_id?: string;
  [key: string]: unknown;
}

// Campaign metrics interface
export interface CampaignMetrics {
  campaign_id: string;
  date: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions?: number;
  revenue?: number;
  ctr?: number;
  cpc?: number;
  cpm?: number;
  roas?: number;
  roi?: number;
  raw_data: Json;
  created_at: string;
}

export interface AccountInfo {
  platform: string;
  account_id: string;
  account_name: string;
  currency?: string;
  timezone?: string;
  status?: string;
  raw_data?: unknown;
}

export interface ConnectionTestResult {
  success: boolean;
  platform: string;
  message: string;
  accountInfo?: {
    id: string;
    name: string;
    currency?: string;
    timezone?: string;
  };
  error?: string;
}

export interface TokenRefreshResult {
  success: boolean;
  platform: string;
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  raw_response?: unknown;
  error?: string;
}
