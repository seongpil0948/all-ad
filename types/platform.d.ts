// Platform-specific types that extend base types
import { PlatformType } from "./base.types";
import { Campaign } from "./campaign.types";
import { SyncResult } from "./sync.types";

// Platform sync service interfaces
export interface PlatformCampaign {
  platform_campaign_id: string;
  name: string;
  status?: string;
  budget?: number;
  is_active: boolean;
  raw_data?: Record<string, unknown>;
}

export interface PlatformCampaignMetrics {
  date: string;
  impressions: number;
  clicks: number;
  conversions?: number;
  cost?: number;
  revenue?: number;
}

// Platform status enum
export enum PlatformStatus {
  CONNECTED = "connected",
  DISCONNECTED = "disconnected",
  ERROR = "error",
  SYNCING = "syncing",
}

// Platform interface
export interface Platform {
  id: string;
  type: PlatformType;
  name: string;
  icon: string;
  status: PlatformStatus;
  connectedAt?: Date;
  lastSyncedAt?: Date;
  accountId?: string;
  accountName?: string;
}

// Base interface for platform adapters
export interface PlatformAdapter {
  type: PlatformType;
  connect(credentials: Record<string, unknown>): Promise<PlatformConnection>;
  disconnect(connectionId: string): Promise<void>;
  syncData(connectionId: string): Promise<SyncResult>;
  getAccounts(connectionId: string): Promise<AdAccount[]>;
  getCampaigns(accountId: string): Promise<Campaign[]>;
}

// Platform connection interface
export interface PlatformConnection {
  id: string;
  platformType: PlatformType;
  accountId: string;
  accountName: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

// Ad account interface
export interface AdAccount {
  id: string;
  name: string;
  currency: string;
  timezone: string;
  status: "active" | "paused" | "suspended";
}

// OAuth credentials type
export interface OAuthCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope?: string[];
}

// API credentials type
export interface ApiCredentials {
  apiKey?: string;
  apiSecret?: string;
  accountId?: string;
  customerId?: string;
}

// Platform-specific display config
export const PLATFORM_CONFIG: Record<
  PlatformType,
  { name: string; icon: string; color: string }
> = {
  google: {
    name: "Google Ads",
    icon: "google",
    color: "#4285F4",
  },
  facebook: {
    name: "Meta Ads",
    icon: "facebook",
    color: "#1877F2",
  },
  kakao: {
    name: "Kakao Moment",
    icon: "kakao",
    color: "#FEE500",
  },
  naver: {
    name: "Naver Ads",
    icon: "naver",
    color: "#03C75A",
  },
  coupang: {
    name: "Coupang Ads",
    icon: "coupang",
    color: "#FF5A5F",
  },
  tiktok: {
    name: "TikTok Ads",
    icon: "tiktok",
    color: "#000000",
  },
};
