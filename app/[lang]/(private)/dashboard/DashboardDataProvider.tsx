"use client";

import { useEffect, useRef } from "react";
import { useShallow } from "zustand/shallow";

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
  const isInitialized = useRef(false);

  // Use useShallow to prevent unnecessary re-renders
  const { setCampaigns, setStats, setLastSync } = useCampaignStore(
    useShallow((state) => ({
      setCampaigns: state.setCampaigns,
      setStats: state.setStats,
      setLastSync: state.setLastSync,
    })),
  );

  // Initialize store only once on mount
  useEffect(() => {
    if (!isInitialized.current) {
      setCampaigns(initialCampaigns);
      setStats(initialStats);
      setLastSync(new Date());
      isInitialized.current = true;
    }
  }, []); // Empty dependency array - run only once

  return <>{children}</>;
}
