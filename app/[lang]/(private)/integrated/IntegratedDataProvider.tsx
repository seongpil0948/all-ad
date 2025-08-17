"use client";

import { useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { useShallow } from "zustand/shallow";

import { usePlatformStore, useTeamStore, useAuthStore } from "@/stores";
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
  const setCredentials = usePlatformStore(
    useShallow((state) => state.setCredentials),
  );
  const setInitialData = useTeamStore(
    useShallow((state) => state.setInitialData),
  );

  useEffect(() => {
    // Set initial data to stores only once on mount.
    // The data is fetched on the server and is fresh on each page load.
    // Subsequent client-side updates are handled by store actions.
    setCredentials(initialData.credentials);
    setInitialData({
      currentTeam: initialData.team,
      teamMembers: initialData.teamMembers,
      userRole: initialData.userRole as UserRole,
    });

    // Set user data to auth store
    useAuthStore.setState({ user: initialData.user });
  }, []);

  return <>{children}</>;
}
