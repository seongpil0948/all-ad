// Platform-related type definitions

export enum PlatformType {
  GOOGLE = "google",
  META = "meta",
  COUPANG = "coupang",
  NAVER = "naver", // For V2.0
}

export enum PlatformStatus {
  CONNECTED = "connected",
  DISCONNECTED = "disconnected",
  ERROR = "error",
  SYNCING = "syncing",
}

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

export type PlatformCredential = Record<string, any>;

// Base interface for platform adapters
export interface PlatformAdapter {
  type: PlatformType;
  connect(credentials: any): Promise<PlatformConnection>;
  disconnect(connectionId: string): Promise<void>;
  syncData(connectionId: string): Promise<SyncResult>;
  getAccounts(connectionId: string): Promise<AdAccount[]>;
  getCampaigns(accountId: string): Promise<Campaign[]>;
}

export interface PlatformConnection {
  id: string;
  platformType: PlatformType;
  accountId: string;
  accountName: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface SyncResult {
  success: boolean;
  syncedAt: Date;
  dataCount?: {
    campaigns?: number;
    adGroups?: number;
    ads?: number;
  };
  error?: string;
}

export interface AdAccount {
  id: string;
  name: string;
  currency: string;
  timezone: string;
  status: "active" | "paused" | "suspended";
}

export interface Campaign {
  id: string;
  platformType: PlatformType;
  accountId: string;
  name: string;
  status: "active" | "paused" | "removed";
  budget?: number;
  budgetType?: "daily" | "lifetime";
  startDate?: Date;
  endDate?: Date;
  objective?: string;
  metrics?: CampaignMetrics;
}

export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  spend: number;
  conversions?: number;
  ctr?: number; // Click-through rate
  cpc?: number; // Cost per click
  cpm?: number; // Cost per mille
  roas?: number; // Return on ad spend
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
