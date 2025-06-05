"use client";

import { useEffect } from "react";

import {
  useCampaignStore,
  usePlatformStore,
  useTeamStore,
  useAuthStore,
} from "@/stores";
import { UserRole } from "@/types/database.types";

interface IntegratedData {
  user: any;
  team: any;
  credentials: any[];
  campaigns: any[];
  teamMembers: any[];
  stats: {
    totalCampaigns: number;
    activeCampaigns: number;
    totalBudget: number;
    connectedPlatforms: number;
  };
  userRole: string;
}

interface IntegratedDataProviderProps {
  children: React.ReactNode;
  initialData: IntegratedData;
}

export function IntegratedDataProvider({
  children,
  initialData,
}: IntegratedDataProviderProps) {
  const { setCampaigns, setStats } = useCampaignStore();
  const { setCredentials } = usePlatformStore();
  const { setInitialData } = useTeamStore();

  useEffect(() => {
    // Set initial data to stores (user data is already handled by auth context)
    setCampaigns(initialData.campaigns);
    setStats({
      totalCampaigns: initialData.stats.totalCampaigns,
      activeCampaigns: initialData.stats.activeCampaigns,
      totalBudget: initialData.stats.totalBudget,
      totalSpend: 0,
      totalImpressions: 0,
      totalClicks: 0,
      platforms: initialData.stats.connectedPlatforms,
    });
    setCredentials(initialData.credentials);
    setInitialData({
      currentTeam: initialData.team,
      teamMembers: initialData.teamMembers,
      userRole: initialData.userRole as UserRole,
    });

    // Set user data to auth store
    useAuthStore.setState({ user: initialData.user });
  }, [initialData, setCampaigns, setStats, setCredentials, setInitialData]);

  return <>{children}</>;
}
