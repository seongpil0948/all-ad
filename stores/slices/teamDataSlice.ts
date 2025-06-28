// Team data slice

import { StateCreator } from "zustand";

import { Team, TeamMemberWithProfile, TeamInvitation, UserRole } from "@/types";

export interface TeamDataSlice {
  currentTeam: Team | null;
  teamMembers: TeamMemberWithProfile[] | null;
  teamInvitations: TeamInvitation[] | null;
  userRole: UserRole | null;
  setCurrentTeam: (team: Team | null) => void;
  setTeamMembers: (members: TeamMemberWithProfile[] | null) => void;
  setTeamInvitations: (invitations: TeamInvitation[] | null) => void;
  setUserRole: (role: UserRole | null) => void;
  setInitialData: (data: {
    currentTeam: Team | null;
    userRole: UserRole | null;
    teamMembers: TeamMemberWithProfile[] | null;
  }) => void;
}

export const createTeamDataSlice: StateCreator<
  TeamDataSlice,
  [],
  [],
  TeamDataSlice
> = (set) => ({
  currentTeam: null,
  teamMembers: null,
  teamInvitations: null,
  userRole: null,
  setCurrentTeam: (currentTeam) => set({ currentTeam }),
  setTeamMembers: (teamMembers) => set({ teamMembers }),
  setTeamInvitations: (teamInvitations) => set({ teamInvitations }),
  setUserRole: (userRole) => set({ userRole }),
  setInitialData: (data) => {
    set({
      currentTeam: data.currentTeam,
      userRole: data.userRole,
      teamMembers: data.teamMembers,
    });
  },
});
