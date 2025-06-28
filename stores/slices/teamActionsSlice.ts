// Team actions slice

import { StateCreator } from "zustand";

import { LoadingSlice } from "./loadingSlice";
import { ErrorSlice } from "./errorSlice";
import { TeamDataSlice } from "./teamDataSlice";

import { Team, TeamMemberWithProfile, TeamInvitation, UserRole } from "@/types";
import { createClient } from "@/utils/supabase/client";
import log from "@/utils/logger";

// Type definitions

export interface TeamActionsSlice {
  fetchCurrentTeam: () => Promise<void>;
  fetchTeamMembers: () => Promise<void>;
  inviteTeamMember: (email: string, role: UserRole) => Promise<void>;
  updateMemberRole: (memberId: string, newRole: UserRole) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  acceptInvitation: (invitationId: string) => Promise<void>;
  declineInvitation: (invitationId: string) => Promise<void>;
  fetchInvitations: () => Promise<void>;
}

type TeamStoreSlices = LoadingSlice &
  ErrorSlice &
  TeamDataSlice &
  TeamActionsSlice;

export const createTeamActionsSlice: StateCreator<
  TeamStoreSlices,
  [],
  [],
  TeamActionsSlice
> = (set, get) => ({
  fetchCurrentTeam: async () => {
    const supabase = createClient();

    set({ isLoading: true, error: null });

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("No user logged in");

      log.info("Fetching team for user", { userId: user.id });

      // First, try to get team where user is master
      const { data: masterTeam, error: masterError } = await supabase
        .from("teams")
        .select("*")
        .eq("master_user_id", user.id)
        .maybeSingle();

      if (!masterError && masterTeam) {
        log.info("User is master of team", { teamId: masterTeam.id });
        set({
          currentTeam: masterTeam,
          userRole: "master",
          isLoading: false,
        });

        return;
      }

      // If not master, check team membership
      const { data: membership, error: memberError } = await supabase
        .from("team_members")
        .select(
          `
          team_id,
          role,
          teams!inner (*)
        `,
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (!memberError && membership) {
        log.info("User is member of team", {
          teamId: membership.team_id,
          role: membership.role,
        });
        set({
          currentTeam: membership.teams as Team,
          userRole: membership.role as UserRole,
          isLoading: false,
        });

        return;
      }

      log.warn("User has no team", { userId: user.id });
      set({ currentTeam: null, userRole: null, isLoading: false });
    } catch (error) {
      log.error("Failed to fetch current team", error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchTeamMembers: async () => {
    const currentTeam = get().currentTeam;

    if (!currentTeam) return;

    const supabase = createClient();

    set({ isLoading: true, error: null });

    try {
      // First get team members
      const { data: teamMembersData, error: teamMembersError } = await supabase
        .from("team_members")
        .select("*")
        .eq("team_id", currentTeam.id);

      if (teamMembersError) throw teamMembersError;

      // Then get profiles for each team member
      const userIds =
        teamMembersData?.map((member) => member.user_id).filter(Boolean) || [];

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds as string[]);

      if (profilesError) throw profilesError;

      // Merge the data
      const data = teamMembersData?.map((member) => ({
        ...member,
        profiles:
          profilesData?.find((profile) => profile.id === member.user_id) ||
          null,
      }));

      const error = null;

      if (error) throw error;

      const teamMembers: TeamMemberWithProfile[] =
        data?.map((member) => ({
          id: member.id,
          team_id: member.team_id || "",
          user_id: member.user_id || "",
          role: member.role as UserRole,
          invited_by: member.invited_by,
          joined_at: member.joined_at,
          profiles: member.profiles || null,
        })) || [];

      set({ teamMembers, isLoading: false });
    } catch (error) {
      log.error("Failed to fetch team members", error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  inviteTeamMember: async (email, role) => {
    const currentTeam = get().currentTeam;
    const userRole = get().userRole;

    if (!currentTeam || userRole !== "master") {
      set({ error: "권한이 없습니다." });

      return;
    }

    const supabase = createClient();

    set({ isLoading: true, error: null });

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("No user logged in");

      const { error } = await supabase.from("team_invitations").insert({
        team_id: currentTeam.id,
        email,
        role,
        invited_by: user.id,
      });

      if (error) throw error;

      await get().fetchInvitations();
      set({ isLoading: false });
    } catch (error) {
      log.error("Failed to invite team member", error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateMemberRole: async (memberId, newRole) => {
    const userRole = get().userRole;

    if (userRole !== "master") {
      set({ error: "권한이 없습니다." });

      return;
    }

    const supabase = createClient();

    set({ isLoading: true, error: null });

    try {
      const { error } = await supabase
        .from("team_members")
        .update({ role: newRole })
        .eq("id", memberId);

      if (error) throw error;

      await get().fetchTeamMembers();
      set({ isLoading: false });
    } catch (error) {
      log.error("Failed to update member role", error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  removeMember: async (memberId) => {
    const userRole = get().userRole;

    if (userRole !== "master") {
      set({ error: "권한이 없습니다." });

      return;
    }

    const supabase = createClient();

    set({ isLoading: true, error: null });

    try {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      await get().fetchTeamMembers();
      set({ isLoading: false });
    } catch (error) {
      log.error("Failed to remove member", error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  acceptInvitation: async (invitationId) => {
    const supabase = createClient();

    set({ isLoading: true, error: null });

    try {
      // First get the invitation token from the invitation id
      const { data: invitation, error: fetchError } = await supabase
        .from("team_invitations")
        .select("token")
        .eq("id", invitationId)
        .single();

      if (fetchError || !invitation)
        throw fetchError || new Error("Invitation not found");

      const { error } = await supabase.rpc("accept_team_invitation", {
        invitation_token: invitation.token,
      });

      if (error) throw error;

      await get().fetchCurrentTeam();
      await get().fetchInvitations();
      set({ isLoading: false });
    } catch (error) {
      log.error("Failed to accept invitation", error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  declineInvitation: async (invitationId) => {
    const supabase = createClient();

    set({ isLoading: true, error: null });

    try {
      const { error } = await supabase
        .from("team_invitations")
        .update({ status: "cancelled" })
        .eq("id", invitationId);

      if (error) throw error;

      await get().fetchInvitations();
      set({ isLoading: false });
    } catch (error) {
      log.error("Failed to decline invitation", error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchInvitations: async () => {
    const supabase = createClient();

    set({ isLoading: true, error: null });

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !user.email)
        throw new Error("No user logged in or email not found");

      const { data, error } = await supabase
        .from("team_invitations")
        .select(
          `
          *,
          teams (
            id,
            name
          )
        `,
        )
        .eq("email", user.email)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;

      set({
        teamInvitations: data as TeamInvitation[],
        isLoading: false,
      });
    } catch (error) {
      log.error("Failed to fetch invitations", error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },
});
