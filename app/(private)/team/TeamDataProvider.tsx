"use client";

import { useCallback } from "react";
import { useShallow } from "zustand/shallow";

import { DataProvider } from "@/components/common";
import { useTeamStore } from "@/stores";
import { Team, TeamMemberWithProfile, UserRole } from "@/types/database.types";

interface TeamDataProviderProps {
  initialTeam: Team | null;
  initialUserRole: UserRole | null;
  initialTeamMembers: TeamMemberWithProfile[] | null;
  children: React.ReactNode;
}

interface TeamData {
  currentTeam: Team | null;
  userRole: UserRole | null;
  teamMembers: TeamMemberWithProfile[] | null;
}

export function TeamDataProvider({
  initialTeam,
  initialUserRole,
  initialTeamMembers,
  children,
}: TeamDataProviderProps) {
  const setInitialData = useTeamStore(
    useShallow((state) => state.setInitialData),
  );

  const handleDataMount = useCallback(
    (data: TeamData) => {
      setInitialData(data);
    },
    [setInitialData],
  );

  return (
    <DataProvider
      initialData={{
        currentTeam: initialTeam,
        userRole: initialUserRole,
        teamMembers: initialTeamMembers,
      }}
      onMount={handleDataMount}
    >
      {children}
    </DataProvider>
  );
}
