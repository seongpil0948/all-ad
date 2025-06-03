import { create } from "zustand";

import { createClient } from "@/utils/supabase/client";
import {
  Team,
  TeamMemberWithProfile,
  TeamInvitation,
  UserRole,
} from "@/types/database.types";
import logger from "@/utils/logger";

interface TeamState {
  currentTeam: Team | null;
  teamMembers: TeamMemberWithProfile[] | null;
  teamInvitations: TeamInvitation[] | null;
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
  fetchTeamInvitations: () => Promise<void>;
  inviteTeamMember: (email: string, role: UserRole) => Promise<string | null>;
  updateTeamMemberRole: (memberId: string, role: UserRole) => Promise<void>;
  removeTeamMember: (memberId: string) => Promise<void>;
  cancelInvitation: (invitationId: string) => Promise<void>;
  clearError: () => void;
}

export const useTeamStore = create<TeamState>()((set, get) => ({
  currentTeam: null,
  teamMembers: null,
  teamInvitations: null,
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

  fetchTeamInvitations: async () => {
    const supabase = createClient();
    const { currentTeam } = get();

    if (!currentTeam) {
      logger.warn("No team selected when fetching invitations");
      set({ teamInvitations: [], isLoading: false });

      return;
    }

    set({ isLoading: true, error: null });

    try {
      logger.info("Fetching team invitations", { teamId: currentTeam.id });

      const { data, error } = await supabase
        .from("team_invitations")
        .select("*")
        .eq("team_id", currentTeam.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        logger.error("Error fetching team invitations", error);
        throw error;
      }

      logger.info("Team invitations fetched", { count: data?.length || 0 });
      set({
        teamInvitations: data || [],
        isLoading: false,
      });
    } catch (error) {
      logger.error(`Error in fetchTeamInvitations ${error}`);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  inviteTeamMember: async (email: string, role: UserRole) => {
    const supabase = createClient();
    const { currentTeam, userRole } = get();

    if (!currentTeam) {
      set({ error: "No team selected" });

      return null;
    }

    if (userRole !== "master" && userRole !== "team_mate") {
      set({ error: "Insufficient permissions to invite members" });

      return null;
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

      // Check if team has reached member limit (V1.0: max 5 members)
      const { data: canInvite, error: limitError } = await supabase.rpc(
        "check_team_member_limit",
        { team_id_param: currentTeam.id },
      );

      if (limitError) {
        logger.error("Error checking team member limit", limitError);
        throw new Error("Failed to check team member limit");
      }

      if (!canInvite) {
        throw new Error(
          "Team has reached the maximum member limit (5 members)",
        );
      }

      // Check if user is already a member (including master)
      if (email === user.email) {
        throw new Error("You cannot invite yourself");
      }

      // Check if invitation already exists
      const { data: existingInvitation } = await supabase
        .from("team_invitations")
        .select("id, status")
        .eq("team_id", currentTeam.id)
        .eq("email", email)
        .eq("status", "pending")
        .maybeSingle();

      if (existingInvitation) {
        throw new Error("An invitation is already pending for this email");
      }

      // Check if user exists in the system
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (existingUser) {
        // User exists, check if already a team member
        const { data: existingMember } = await supabase
          .from("team_members")
          .select("id")
          .eq("team_id", currentTeam.id)
          .eq("user_id", existingUser.id)
          .maybeSingle();

        if (existingMember) {
          throw new Error("User is already a team member");
        }

        // Check if user is the master
        const { data: team } = await supabase
          .from("teams")
          .select("master_user_id")
          .eq("id", currentTeam.id)
          .single();

        if (team?.master_user_id === existingUser.id) {
          throw new Error("User is already the team master");
        }
      }

      // Create invitation
      const { data: invitation, error: inviteError } = await supabase
        .from("team_invitations")
        .insert({
          team_id: currentTeam.id,
          email,
          role,
          invited_by: user.id,
        })
        .select("token")
        .single();

      if (inviteError) {
        logger.error("Failed to create invitation", inviteError);
        throw new Error("Failed to create invitation");
      }

      logger.info("Team invitation created successfully", {
        email,
        token: invitation.token,
      });

      // Generate invitation link
      const invitationLink = `${window.location.origin}/invite/${invitation.token}`;

      logger.info("Invitation link:", { link: invitationLink });

      // Send invitation email
      try {
        const inviterProfile = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", user.id)
          .single();

        const teamData = await supabase
          .from("teams")
          .select("name")
          .eq("id", currentTeam.id)
          .single();

        const emailResponse = await fetch("/api/team/invite", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            inviterName:
              inviterProfile.data?.full_name ||
              inviterProfile.data?.email ||
              "A team member",
            teamName: teamData.data?.name || "the team",
            invitationLink,
          }),
        });

        if (!emailResponse.ok) {
          logger.error("Failed to send invitation email", {
            status: emailResponse.status,
          });
          // Don't throw error - invitation is still created even if email fails
        } else {
          logger.info("Invitation email sent successfully", { email });
        }
      } catch (emailError) {
        logger.error("Error sending invitation email", emailError);
        // Don't throw error - invitation is still created even if email fails
      }

      // Refresh invitations list
      await get().fetchTeamInvitations();

      set({ isLoading: false });

      return invitationLink;
    } catch (error) {
      logger.error("Error in inviteTeamMember", error as Error);
      set({ error: (error as Error).message, isLoading: false });

      return null;
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

  cancelInvitation: async (invitationId: string) => {
    const supabase = createClient();
    const { currentTeam, userRole } = get();

    if (!currentTeam || userRole !== "master") {
      set({ error: "Insufficient permissions" });

      return;
    }

    set({ isLoading: true, error: null });

    try {
      logger.info("Cancelling invitation", { invitationId });

      const { error } = await supabase
        .from("team_invitations")
        .update({ status: "cancelled" })
        .eq("id", invitationId)
        .eq("team_id", currentTeam.id);

      if (error) {
        logger.error("Failed to cancel invitation", error);
        throw error;
      }

      await get().fetchTeamInvitations();
      set({ isLoading: false });
    } catch (error) {
      logger.error("Error in cancelInvitation", error as Error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
