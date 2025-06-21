"use client";

import { useCallback } from "react";

import { DataProvider } from "@/components/common";
import { useCampaignStore } from "@/stores";
import { Campaign as AppCampaign, CampaignStats } from "@/types/campaign.types";

interface DashboardDataProviderProps {
  initialCampaigns: AppCampaign[];
  initialStats: CampaignStats;
  children: React.ReactNode;
}

interface DashboardData {
  campaigns: AppCampaign[];
  stats: CampaignStats;
}

export function DashboardDataProvider({
  initialCampaigns,
  initialStats,
  children,
}: DashboardDataProviderProps) {
  const setCampaigns = useCampaignStore((state) => state.setCampaigns);
  const setStats = useCampaignStore((state) => state.setStats);

  const handleDataMount = useCallback(
    (data: DashboardData) => {
      setCampaigns(data.campaigns);
      setStats(data.stats);
    },
    [setCampaigns, setStats],
  );

  return (
    <DataProvider
      initialData={{ campaigns: initialCampaigns, stats: initialStats }}
      onMount={handleDataMount}
    >
      {children}
    </DataProvider>
  );
}
