// Dashboard and report type definitions
import { PlatformType } from "./base.types";

export interface DashboardFilter {
  dateRange: DashboardDateRange;
  platforms?: PlatformType[];
  accounts?: string[];
  campaigns?: string[];
}

export interface DashboardDateRange {
  start: Date;
  end: Date;
  preset?:
    | "today"
    | "yesterday"
    | "last7days"
    | "last30days"
    | "thisMonth"
    | "lastMonth"
    | "custom";
}

export interface DashboardMetrics {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  averageCtr: number;
  averageCpc: number;
  averageRoas: number;
  previousPeriod?: DashboardMetrics; // For comparison
}

export interface PlatformSummary {
  platform: PlatformType;
  metrics: DashboardMetrics;
  topCampaigns: DashboardCampaignSummary[];
  syncStatus: {
    lastSynced: Date;
    nextSync?: Date;
    isLoading: boolean;
    error?: string;
  };
}

export interface DashboardCampaignSummary {
  id: string;
  name: string;
  status: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions?: number;
  roas?: number;
  trend?: "up" | "down" | "stable";
}

export interface Report {
  id: string;
  name: string;
  type: "daily" | "weekly" | "monthly" | "custom";
  createdBy: string;
  createdAt: Date;
  filters: DashboardFilter;
  metrics: string[]; // Selected metrics to include
  schedule?: ReportSchedule;
}

export interface ReportSchedule {
  enabled: boolean;
  frequency: "daily" | "weekly" | "monthly";
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  time: string; // HH:mm format
  recipients: string[]; // Email addresses
  lastSentAt?: Date;
  nextSendAt?: Date;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
}
