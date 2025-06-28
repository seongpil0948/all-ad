"use client";

import { useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { useShallow } from "zustand/shallow";

import {
  useCampaignStore,
  usePlatformStore,
  useTeamStore,
  useAuthStore,
} from "@/stores";
import {
  UserRole,
  Team,
  PlatformCredential,
  TeamMemberWithProfile,
} from "@/types";
import { Campaign as AppCampaign } from "@/types/campaign.types";

interface IntegratedData {
  user: User;
  team: Team;
  credentials: PlatformCredential[];
  campaigns: AppCampaign[];
  teamMembers: TeamMemberWithProfile[];
  stats: {
    totalCampaigns: number;
    activeCampaigns: number;
    totalBudget: number;
    connectedPlatforms: number;
  };
  userRole: UserRole;
}

interface IntegratedDataProviderProps {
  children: React.ReactNode;
  initialData: IntegratedData;
}

export function IntegratedDataProvider({
  children,
  initialData,
}: IntegratedDataProviderProps) {
  const { setCampaigns, setStats } = useCampaignStore(
    useShallow((state) => ({
      setCampaigns: state.setCampaigns,
      setStats: state.setStats,
    })),
  );
  const setCredentials = usePlatformStore(
    useShallow((state) => state.setCredentials),
  );
  const setInitialData = useTeamStore(
    useShallow((state) => state.setInitialData),
  );

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
