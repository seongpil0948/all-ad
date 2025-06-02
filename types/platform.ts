// Platform related types
export type PlatformType =
  | "facebook"
  | "google"
  | "kakao"
  | "naver"
  | "coupang";

export type UserRole = "master" | "viewer" | "editor";

export interface Team {
  id: string;
  name: string;
  master_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: UserRole;
  invited_by?: string;
  joined_at: string;
  user?: {
    email: string;
    full_name?: string;
  };
}

export interface PlatformCredential {
  id: string;
  team_id: string;
  platform: PlatformType;
  credentials: Record<string, any>;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  team_id: string;
  platform: PlatformType;
  platform_campaign_id: string;
  name: string;
  status?: string;
  budget?: number;
  is_active: boolean;
  raw_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
  synced_at?: string;
}

export interface CampaignMetrics {
  id: string;
  campaign_id: string;
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  cost: number;
  revenue: number;
  raw_data?: Record<string, any>;
  created_at: string;
}

// Platform credential schemas
export interface FacebookCredentials {
  access_token: string;
  ad_account_id: string;
  app_id?: string;
  app_secret?: string;
}

export interface GoogleCredentials {
  refresh_token: string;
  client_id: string;
  client_secret: string;
  developer_token?: string;
  customer_id?: string;
}

export interface KakaoCredentials {
  access_token: string;
  refresh_token: string;
  ad_account_id: string;
}

export interface NaverCredentials {
  access_token: string;
  secret_key: string;
  customer_id: string;
}

export interface CoupangCredentials {
  access_key: string;
  secret_key: string;
  vendor_id: string;
}
