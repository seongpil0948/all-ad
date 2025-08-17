// 컴포넌트 Props 타입 정의

import { ThemeProviderProps } from "next-themes";
import * as echarts from "echarts";

import { PlatformType } from "./database.types";
import { Campaign } from "./campaign.types";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

export interface PlatformCredentialFormProps {
  platform: PlatformType;
  initialValues?: Record<string, unknown>;
  onSubmit: (credentials: Record<string, unknown>) => void;
}

export interface CampaignTableProps {
  campaigns: Campaign[];
  onUpdateBudget: (
    campaignId: string,
    platform: Campaign["platform"],
    platformCampaignId: string,
    budget: number,
  ) => Promise<void>;
  onUpdateStatus: (
    campaignId: string,
    platform: Campaign["platform"],
    platformCampaignId: string,
    isActive: boolean,
  ) => Promise<void>;
}

export interface EChartsProps {
  option: echarts.EChartsCoreOption;
  style?: React.CSSProperties;
  className?: string;
}

export interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl?: string;
  onUploadComplete: (url: string) => void;
  onDeleteComplete: () => void;
}

export interface MessageCardProps {
  message: string;
  type: "success" | "error" | "info" | "warning";
  onClose?: () => void;
}

// Common component props
export interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
}

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  type?: "error" | "warning" | "info";
}

export interface PageHeaderProps {
  pageTitle: string;
  pageSubtitle?: string;
  highlight?: string;
  actions?: React.ReactNode;
  centered?: boolean;
  className?: string;
  className?: string;
  children?: React.ReactNode;
}

export interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  description?: string;
}

export interface CTAButtonProps {
  children: React.ReactNode;
  href?: string;
  color?: "primary" | "secondary" | "success" | "warning" | "danger";
  variant?: "solid" | "bordered" | "light" | "flat" | "shadow";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  className?: string;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  onPress?: () => void;
}

// Auth related props
export interface AuthFormProps {
  type: "login" | "signup";
}

// Dashboard related props
export interface SyncButtonProps {
  platform?: PlatformType;
  onSync?: () => void;
}

export interface DashboardDataProviderProps {
  children: React.ReactNode;
}
