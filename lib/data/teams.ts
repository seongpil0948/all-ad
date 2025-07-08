import type { Database } from "@/types/supabase.types";

import { createServiceClient } from "@/utils/supabase/service";
import { createClient } from "@/utils/supabase/server";
import log from "@/utils/logger";

type Tables = Database["public"]["Tables"];
type TeamsInsert = Tables["teams"]["Insert"];
type TeamMembersInsert = Tables["team_members"]["Insert"];

export interface TeamCreationResult {
  success: boolean;
  teamId?: string;
  message: string;
  error?: string;
}

/**
 * Common function to create a team and assign the user as master
 * Uses database functions and proper RLS handling
 */
export async function createTeamForUser(
  userId: string,
  teamName?: string,
): Promise<TeamCreationResult> {
  try {
    // Use service client to bypass RLS for team creation
    const serviceClient = createServiceClient();

    // First check if user already has a team using the database function
    const { data: existingTeamId, error: rpcError } = await serviceClient.rpc(
      "create_team_for_user",
      { user_id: userId },
    );

    // If RPC has ambiguity error or other errors, fallback to manual creation
    if (rpcError || existingTeamId === null) {
      log.warn("RPC failed or returned null, attempting manual team creation", {
        userId,
        rpcError: rpcError?.message,
        rpcCode: rpcError?.code,
      });

      return await createTeamManually(userId, teamName);
    }

    if (existingTeamId) {
      log.info("Team created or already exists for user", {
        userId,
        teamId: existingTeamId,
      });

      return {
        success: true,
        teamId: existingTeamId,
        message: "Team ready",
      };
    }

    // Fallback manual creation if RPC fails
    log.warn("RPC returned empty result, attempting manual team creation", {
      userId,
    });

    return await createTeamManually(userId, teamName);
  } catch (error) {
    log.error("Error in createTeamForUser", { userId, error });

    return {
      success: false,
      message: "Internal error during team creation",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Manual team creation as fallback
 */
async function createTeamManually(
  userId: string,
  teamName?: string,
): Promise<TeamCreationResult> {
  const serviceClient = createServiceClient();

  try {
    // Check if user already has a team as master
    const { data: existingTeam } = await serviceClient
      .from("teams")
      .select("id")
      .eq("master_user_id", userId)
      .single();

    if (existingTeam) {
      return {
        success: true,
        teamId: existingTeam.id,
        message: "User already has a team",
      };
    }

    // Check if user is already a team member
    const { data: existingMembership } = await serviceClient
      .from("team_members")
      .select("team_id")
      .eq("user_id", userId)
      .single();

    if (existingMembership) {
      return {
        success: true,
        teamId: existingMembership.team_id!,
        message: "User already has a team",
      };
    }

    // Get user email for default team name
    const { data: userData } =
      await serviceClient.auth.admin.getUserById(userId);
    const defaultTeamName = teamName || userData.user?.email || "My Team";

    // Create new team
    const { data: newTeam, error: createError } = await serviceClient
      .from("teams")
      .insert({
        name: defaultTeamName,
        master_user_id: userId,
      } satisfies TeamsInsert)
      .select("id")
      .single();

    if (createError) {
      log.error("Failed to create team manually", {
        userId,
        error: createError,
      });

      return {
        success: false,
        message: "Failed to create team",
        error: createError.message,
      };
    }

    // Add user as master to team_members for consistency
    const { error: memberError } = await serviceClient
      .from("team_members")
      .insert({
        team_id: newTeam.id,
        user_id: userId,
        role: "master",
      } satisfies TeamMembersInsert);

    if (memberError) {
      log.warn("Failed to add master to team_members", {
        userId,
        teamId: newTeam.id,
        error: memberError,
      });
      // Don't fail the entire operation for this
    }

    log.info("Team created manually", {
      userId,
      teamId: newTeam.id,
    });

    return {
      success: true,
      teamId: newTeam.id,
      message: "Team created successfully",
    };
  } catch (error) {
    log.error("Error in manual team creation", { userId, error });

    return {
      success: false,
      message: "Internal error during team creation",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Ensure user has a team, create if necessary
 * This is used during authentication flows
 */
export async function ensureUserHasTeam(
  userId: string,
): Promise<TeamCreationResult> {
  try {
    const supabase = await createClient();

    // Use the database function to ensure user has a team
    const { error: ensureError } = await supabase.rpc("ensure_user_has_team");

    if (ensureError) {
      log.error("Failed to ensure user has team", {
        userId,
        error: ensureError,
      });

      // Fallback to createTeamForUser
      return await createTeamForUser(userId);
    }

    // Get user's team to return the team ID
    const { data: userTeams, error: teamsError } = await supabase.rpc(
      "user_teams",
      {
        user_id: userId,
      },
    );

    if (teamsError || !userTeams || userTeams.length === 0) {
      log.warn("User teams query failed after ensure", {
        userId,
        error: teamsError,
      });

      // Fallback to createTeamForUser
      return await createTeamForUser(userId);
    }

    const teamId = userTeams[0].team_id;

    return {
      success: true,
      teamId,
      message: "Team ensured",
    };
  } catch (error) {
    log.error("Error in ensureUserHasTeam", { userId, error });

    return await createTeamForUser(userId);
  }
}

/**
 * Get user's primary team
 */
export async function getUserPrimaryTeam(
  userId: string,
): Promise<string | null> {
  try {
    const supabase = await createClient();

    const { data: userTeams, error } = await supabase.rpc("user_teams", {
      user_id: userId,
    });

    if (error || !userTeams || userTeams.length === 0) {
      log.warn("No teams found for user", { userId, error });

      return null;
    }

    return userTeams[0].team_id;
  } catch (error) {
    log.error("Error getting user primary team", { userId, error });

    return null;
  }
}
