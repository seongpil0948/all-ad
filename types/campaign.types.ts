// Campaign related types
import { CampaignStatus, BudgetType, DateRange } from "./base.types";

import { PlatformType } from "@/types";

// Platform credentials interface
export interface PlatformCredentials {
  id: string;
  team_id: string;
  platform: PlatformType;
  account_id: string;
  account_name?: string;
  credentials: Record<string, unknown>;
  access_token?: string;
  refresh_token?: string;
  expires_at?: string;
  scope?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_synced_at?: string;
}

// Application layer campaign interface
export interface Campaign {
  id: string;
  team_id?: string;
  platform: PlatformType;
  platform_campaign_id: string;
  platform_credential_id?: string;
  name: string;
  status?: string;
  is_active: boolean;
  budget?: number;
  raw_data?: Record<string, unknown>;
  synced_at?: string;
  created_at?: string;
  updated_at?: string;

  // Legacy fields for compatibility
  teamId?: string;
  platformCampaignId?: string;
  accountId?: string;
  budgetType?: BudgetType;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  metrics?: CampaignMetrics;
}

// Campaign statistics interface
export interface CampaignStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalBudget: number;
  totalSpend: number;
  totalClicks: number;
  totalImpressions: number;
  platforms: number;
}

// Campaign metrics interface
export interface CampaignMetrics {
  id?: string;
  campaign_id?: string;
  date: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions?: number;
  revenue?: number;
  raw_data?: Record<string, unknown>;
  created_at?: string;

  // Calculated fields
  ctr?: number;
  cpc?: number;
  cpm?: number;
  roas?: number;
  roi?: number;
}

// Campaign filter interface
export interface CampaignFilter {
  platforms?: PlatformType[];
  status?: CampaignStatus[];
  dateRange?: DateRange;
  search?: string;
  accountIds?: string[];
}

// Campaign summary interface
export interface CampaignSummary {
  totalCampaigns: number;
  activeCampaigns: number;
  pausedCampaigns: number;
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  averageCtr: number;
  averageCpc: number;
  roas: number;
}

// Campaign update request
export interface CampaignUpdateRequest {
  campaignId: string;
  platform: PlatformType;
  updates: Partial<{
    status: CampaignStatus;
    budget: number;
    name: string;
    startDate: string;
    endDate: string;
  }>;
}
