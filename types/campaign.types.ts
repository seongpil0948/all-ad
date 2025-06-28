// Campaign related types
import {
  PlatformType,
  CampaignStatus,
  BudgetType,
  DateRange,
} from "./base.types";

// Application layer campaign interface
export interface Campaign {
  id: string;
  teamId: string;
  platform: PlatformType;
  platformCampaignId: string;
  accountId?: string;
  name: string;
  status: CampaignStatus;
  budget?: number;
  budgetType?: BudgetType;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
  date?: string;
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
