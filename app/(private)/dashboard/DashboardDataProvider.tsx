"use client";

import { useEffect } from "react";

import { useCampaignStore } from "@/stores";
import { Campaign } from "@/types/database.types";
import { transformDbCampaignToApp } from "@/utils/campaign-transformer";

interface DashboardDataProviderProps {
  initialCampaigns: Campaign[];
  initialStats: {
    totalCampaigns: number;
    activeCampaigns: number;
    totalBudget: number;
    totalSpend: number;
    totalClicks: number;
    totalImpressions: number;
    platforms: number;
  };
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
    const transformedCampaigns = initialCampaigns.map(transformDbCampaignToApp);

    setCampaigns(transformedCampaigns);
    setStats({
      totalCampaigns: initialStats.totalCampaigns,
      activeCampaigns: initialStats.activeCampaigns,
      totalBudget: initialStats.totalBudget,
      totalSpend: initialStats.totalSpend,
      totalClicks: initialStats.totalClicks,
      totalImpressions: initialStats.totalImpressions,
      platforms: initialStats.platforms,
    });
  }, []);

  return <>{children}</>;
}
