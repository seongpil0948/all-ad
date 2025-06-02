"use client";

import { useEffect } from "react";

import { useTeamStore } from "@/stores";
import { Team, TeamMemberWithProfile, UserRole } from "@/types/database.types";

interface TeamDataProviderProps {
  initialTeam: Team | null;
  initialUserRole: UserRole | null;
  initialTeamMembers: TeamMemberWithProfile[] | null;
  children: React.ReactNode;
}

export function TeamDataProvider({
  initialTeam,
  initialUserRole,
  initialTeamMembers,
  children,
}: TeamDataProviderProps) {
  const setInitialData = useTeamStore((state) => state.setInitialData);

  useEffect(() => {
    // Set initial data from server
    setInitialData({
      currentTeam: initialTeam,
      userRole: initialUserRole,
      teamMembers: initialTeamMembers,
    });
  }, []);

  return <>{children}</>;
}
