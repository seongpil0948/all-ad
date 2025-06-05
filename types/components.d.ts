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
  initialValues?: Record<string, any>;
  onSubmit: (credentials: Record<string, any>) => void;
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
