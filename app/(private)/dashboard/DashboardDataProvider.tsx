"use client";

import { useEffect } from "react";

import { useCampaignStore } from "@/stores";
import { Campaign as AppCampaign, CampaignStats } from "@/types/campaign.types";

interface DashboardDataProviderProps {
  initialCampaigns: AppCampaign[];
  initialStats: CampaignStats;
  children: React.ReactNode;
}

export function DashboardDataProvider({
  initialCampaigns,
  initialStats,
  children,
}: DashboardDataProviderProps) {
  const setCampaigns = useCampaignStore((state) => state.setCampaigns);
  const setStats = useCampaignStore((state) => state.setStats);

  useEffect(() => {
    // Set initial data from server
    setCampaigns(initialCampaigns);
    setStats(initialStats);
  }, []);

  return <>{children}</>;
}
