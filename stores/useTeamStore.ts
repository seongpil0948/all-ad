import { create } from "zustand";

import { createClient } from "@/utils/supabase/client";
import { Team, TeamMemberWithProfile, UserRole } from "@/types/database.types";
import logger from "@/utils/logger";

interface TeamState {
  currentTeam: Team | null;
  teamMembers: TeamMemberWithProfile[] | null;
  userRole: UserRole | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setInitialData: (data: {
    currentTeam: Team | null;
    userRole: UserRole | null;
    teamMembers: TeamMemberWithProfile[] | null;
  }) => void;
  fetchCurrentTeam: () => Promise<void>;
  fetchTeamMembers: () => Promise<void>;
  inviteTeamMember: (email: string, role: UserRole) => Promise<void>;
  updateTeamMemberRole: (memberId: string, role: UserRole) => Promise<void>;
  removeTeamMember: (memberId: string) => Promise<void>;
  clearError: () => void;
}

export const useTeamStore = create<TeamState>()((set, get) => ({
  currentTeam: null,
  teamMembers: null,
  userRole: null,
  isLoading: false,
  error: null,

  setInitialData: (data) => {
    set({
      currentTeam: data.currentTeam,
      userRole: data.userRole,
      teamMembers: data.teamMembers,
      isLoading: false,
      error: null,
    });
  },

  fetchCurrentTeam: async () => {
    const supabase = createClient();

    set({ isLoading: true, error: null });

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("No user logged in");

      logger.info("Fetching team for user", { userId: user.id });

      // First, try to get team where user is master
      const { data: masterTeam, error: masterError } = await supabase
        .from("teams")
        .select("*")
        .eq("master_user_id", user.id)
        .maybeSingle();

      if (masterError) {
        logger.error("Error fetching master team", masterError);
      }

      if (masterTeam) {
        logger.info("User is master of team", { teamId: masterTeam.id });
        set({
          currentTeam: masterTeam,
          userRole: "master",
          isLoading: false,
        });

        return;
      }

      // If not master, get user's team membership
      const { data: membership, error: memberError } = await supabase
        .from("team_members")
        .select("*, teams(*)")
        .eq("user_id", user.id)
        .maybeSingle();

      if (memberError) {
        logger.error("Error fetching team membership", memberError);
      }

      if (!membership) {
        logger.info("No team found for user, creating new team");

        // No team found, create one using RPC function
        const { data: newTeamId, error: createError } = await supabase.rpc(
          "create_team_for_user",
          { user_id: user.id },
        );

        if (createError) {
          logger.error("Failed to create team", createError);
          throw new Error(`Failed to create team: ${createError.message}`);
        }

        if (!newTeamId) {
          throw new Error("Failed to create team: No team ID returned");
        }

        logger.info("Team created successfully", { teamId: newTeamId });

        // Fetch the newly created team
        const { data: newTeam, error: fetchError } = await supabase
          .from("teams")
          .select("*")
          .eq("id", newTeamId)
          .single();

        if (fetchError) {
          logger.error("Failed to fetch new team", fetchError);
          throw new Error(`Failed to fetch new team: ${fetchError.message}`);
        }

        set({
          currentTeam: newTeam,
          userRole: "master",
          isLoading: false,
        });

        return;
      }

      // User is a member of a team
      logger.info("User is member of team", {
        teamId: membership.team_id,
        role: membership.role,
      });

      set({
        currentTeam: membership.teams as Team,
        userRole: membership.role,
        isLoading: false,
      });
    } catch (error) {
      logger.error(`Error in fetchCurrentTeam: ${JSON.stringify(error)}`);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchTeamMembers: async () => {
    const supabase = createClient();
    const { currentTeam } = get();

    if (!currentTeam) {
      logger.warn("No team selected when fetching team members");
      set({ teamMembers: [], isLoading: false });

      return;
    }

    set({ isLoading: true, error: null });

    try {
      logger.info("Fetching team members", { teamId: currentTeam.id });

      const { data, error } = await supabase.rpc(
        "get_team_members_with_profiles",
        {
          team_id_param: currentTeam.id,
        },
      );

      if (error) {
        logger.error("Error fetching team members", error);
        throw error;
      }

      // Transform RPC result to match TeamMemberWithProfile type
      const transformedData =
        data?.map((member: any) => ({
          id: member.id,
          team_id: member.team_id,
          user_id: member.user_id,
          role: member.role,
          invited_by: member.invited_by,
          joined_at: member.joined_at,
          profiles: member.profile_id
            ? {
                id: member.profile_id,
                email: member.email,
                full_name: member.full_name,
                avatar_url: member.avatar_url,
              }
            : null,
        })) || [];

      logger.info("Team members fetched", { count: transformedData.length });
      set({
        teamMembers: transformedData as TeamMemberWithProfile[],
        isLoading: false,
      });
    } catch (error) {
      logger.error(`Error in fetchTeamMembers ${error}`);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  inviteTeamMember: async (email: string, role: UserRole) => {
    const supabase = createClient();
    const { currentTeam, userRole } = get();

    if (!currentTeam) {
      set({ error: "No team selected" });

      return;
    }

    if (userRole !== "master" && userRole !== "editor") {
      set({ error: "Insufficient permissions to invite members" });

      return;
    }

    set({ isLoading: true, error: null });

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("No user logged in");

      logger.info("Inviting team member", {
        email,
        role,
        teamId: currentTeam.id,
      });

      const { data: existingUser, error: userError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single();

      if (userError) {
        logger.error(`Error in fetching user for ${email}`, userError);
        throw userError;
      }

      logger.debug(`Found existing user ${existingUser.id}`);
      const { data: existingMember } = await supabase
        .from("team_members")
        .select("id")
        .eq("team_id", currentTeam.id)
        .eq("user_id", existingUser.id)
        .maybeSingle();

      if (existingMember) {
        throw new Error("User is already a team member");
      }

      const { error } = await supabase.from("team_members").insert({
        team_id: currentTeam.id,
        user_id: existingUser.id,
        role,
        invited_by: user.id,
      });

      if (error) {
        logger.error("Failed to add team member", error);
        throw error;
      }

      logger.info("Team member invited successfully", {
        userId: existingUser.id,
      });

      // Refresh team members
      await get().fetchTeamMembers();
      set({ isLoading: false });
    } catch (error) {
      logger.error("Error in inviteTeamMember", error as Error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateTeamMemberRole: async (memberId: string, role: UserRole) => {
    const supabase = createClient();
    const { currentTeam, userRole } = get();

    if (!currentTeam || userRole !== "master") {
      set({ error: "Insufficient permissions" });

      return;
    }

    set({ isLoading: true, error: null });

    try {
      logger.info("Updating team member role", { memberId, role });

      const { error } = await supabase
        .from("team_members")
        .update({ role })
        .eq("id", memberId);

      if (error) {
        logger.error("Failed to update team member role", error);
        throw error;
      }

      await get().fetchTeamMembers();
      set({ isLoading: false });
    } catch (error) {
      logger.error("Error in updateTeamMemberRole", error as Error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  removeTeamMember: async (memberId: string) => {
    const supabase = createClient();
    const { currentTeam, userRole } = get();

    if (!currentTeam || userRole !== "master") {
      set({ error: "Insufficient permissions" });

      return;
    }

    set({ isLoading: true, error: null });

    try {
      logger.info("Removing team member", { memberId });

      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", memberId);

      if (error) {
        logger.error("Failed to remove team member", error);
        throw error;
      }

      await get().fetchTeamMembers();
      set({ isLoading: false });
    } catch (error) {
      logger.error("Error in removeTeamMember", error as Error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
