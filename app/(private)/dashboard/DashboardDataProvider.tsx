"use client";

import { useEffect } from "react";

import { useCampaignStore } from "@/stores";
import { Campaign } from "@/types/database.types";

interface DashboardDataProviderProps {
  initialCampaigns: Campaign[];
  initialStats: {
    totalCampaigns: number;
    activeCampaigns: number;
    totalBudget: number;
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
    setCampaigns(initialCampaigns);
    setStats(initialStats);
  }, []);

  return <>{children}</>;
}
