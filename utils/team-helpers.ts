import { SupabaseClient } from "@supabase/supabase-js";

import { UserRole } from "@/types";

export interface TeamInfo {
  teamId: string;
  userRole: UserRole;
}

/**
 * Get user's team information (ID and role)
 * Checks both team masters and team members
 */
export async function getUserTeamInfo(
  supabase: SupabaseClient,
  userId: string,
): Promise<TeamInfo | null> {
  // First, check if user is a team master
  const { data: masterTeam } = await supabase
    .from("teams")
    .select("id")
    .eq("master_user_id", userId)
    .maybeSingle();

  if (masterTeam) {
    return {
      teamId: masterTeam.id,
      userRole: "master",
    };
  }

  // Check if user is a team member
  const { data: teamMember } = await supabase
    .from("team_members")
    .select("team_id, role")
    .eq("user_id", userId)
    .maybeSingle();

  if (teamMember) {
    return {
      teamId: teamMember.team_id,
      userRole: teamMember.role,
    };
  }

  return null;
}

/**
 * Check if user has permission to perform actions
 * Masters and team_mates have permission, viewers do not
 */
export function hasActionPermission(userRole: UserRole | null): boolean {
  return userRole === "master" || userRole === "team_mate";
}
