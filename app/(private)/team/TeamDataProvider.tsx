"use client";

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
  const setInitialData = useTeamStore((state) => state.setInitialData);

  return (
    <DataProvider
      initialData={{
        currentTeam: initialTeam,
        userRole: initialUserRole,
        teamMembers: initialTeamMembers,
      }}
      onMount={setInitialData}
    >
      {children}
    </DataProvider>
  );
}