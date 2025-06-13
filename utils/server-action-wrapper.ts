import { User } from "@supabase/supabase-js";

import { createClient } from "@/utils/supabase/server";
import { UserRole } from "@/types";
import log from "@/utils/logger";

interface ActionContext {
  user: User;
  supabase: ReturnType<typeof createClient> extends Promise<infer T>
    ? T
    : never;
  teamId?: string;
  teamRole?: UserRole;
}

interface ActionOptions {
  requiredRole?: UserRole | UserRole[];
  teamId?: string;
}

export async function withAuth<T>(
  action: (context: ActionContext) => Promise<T>,
  options: ActionOptions = {},
): Promise<T> {
  const supabase = await createClient();

  try {
    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      log.error("Authentication failed", authError);
      throw new Error("인증되지 않은 사용자입니다");
    }

    let teamRole: UserRole | undefined;
    let teamId = options.teamId;

    // Check team permissions if teamId is provided
    if (teamId && options.requiredRole) {
      const { data: teamMember, error: teamError } = await supabase
        .from("team_members")
        .select("role, team_id")
        .eq("user_id", user.id)
        .eq("team_id", teamId)
        .single();

      if (teamError || !teamMember) {
        log.error("Team member not found", { userId: user.id, teamId });
        throw new Error("팀 접근 권한이 없습니다");
      }

      teamRole = teamMember.role as UserRole;

      // Check role permissions
      const requiredRoles = Array.isArray(options.requiredRole)
        ? options.requiredRole
        : [options.requiredRole];

      if (!requiredRoles.includes(teamRole)) {
        log.warn("Insufficient permissions", {
          userId: user.id,
          teamId,
          userRole: teamRole,
          requiredRoles,
        });
        throw new Error("권한이 부족합니다");
      }
    }

    // Execute the action
    return await action({
      user,
      supabase,
      teamId,
      teamRole,
    });
  } catch (error) {
    log.error("Server action failed", error);
    throw error;
  }
}

// Helper function for actions that don't require specific team permissions
export async function withUser<T>(
  action: (context: {
    user: User;
    supabase: ActionContext["supabase"];
  }) => Promise<T>,
): Promise<T> {
  return withAuth(({ user, supabase }) => action({ user, supabase }));
}

// Helper function for viewer-accessible actions
export async function withViewer<T>(
  teamId: string,
  action: (context: ActionContext) => Promise<T>,
): Promise<T> {
  return withAuth(action, {
    teamId,
    requiredRole: ["master", "team_mate", "viewer"],
  });
}

// Helper function for team mate actions
export async function withTeamMate<T>(
  teamId: string,
  action: (context: ActionContext) => Promise<T>,
): Promise<T> {
  return withAuth(action, {
    teamId,
    requiredRole: ["master", "team_mate"],
  });
}

// Helper function for master-only actions
export async function withMaster<T>(
  teamId: string,
  action: (context: ActionContext) => Promise<T>,
): Promise<T> {
  return withAuth(action, {
    teamId,
    requiredRole: ["master"],
  });
}
