import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import { UserRole } from "@/types";
import { getUserPrimaryTeamId } from "@/utils/team/user-teams";
import log from "@/utils/logger";

export interface AuthContext {
  user: {
    id: string;
    email: string;
  };
  teamMember: {
    team_id: string;
    role: UserRole;
  };
}

export type ApiHandler = (
  request: NextRequest,
  context: AuthContext,
  routeContext: { params: Promise<Record<string, string>> },
) => Promise<NextResponse>;

/**
 * Authentication middleware for API routes
 * Validates user authentication and team membership
 */
export function withAuth(
  handler: ApiHandler,
  options?: {
    requiredRole?: UserRole[];
    allowViewerRead?: boolean;
  },
) {
  return async (
    request: NextRequest,
    routeContext: { params: Promise<Record<string, string>> },
  ) => {
    try {
      const supabase = await createClient();

      // Check authentication
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        log.warn("Unauthorized API request", {
          path: request.nextUrl.pathname,
          error: authError?.message || "No user found",
        });

        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Get user's primary team ID (with automatic team creation if needed)
      const teamId = await getUserPrimaryTeamId(user.id);

      if (!teamId) {
        log.warn("No team found for user", {
          userId: user.id,
          email: user.email,
        });

        return NextResponse.json({ error: "Team not found" }, { status: 404 });
      }

      // Get user's role in the team (handle multiple records)
      const { data: teamMembers, error: teamError } = await supabase
        .from("team_members")
        .select("role")
        .eq("user_id", user.id)
        .eq("team_id", teamId);

      if (teamError || !teamMembers || teamMembers.length === 0) {
        log.warn("Team membership not found", {
          userId: user.id,
          teamId,
          error: teamError?.message || "No team membership found",
        });

        return NextResponse.json(
          { error: "Team membership not found" },
          { status: 404 },
        );
      }

      // If multiple records exist, pick the first one (or highest role)
      const teamMember = teamMembers[0];

      // Check role permissions
      if (
        options?.requiredRole &&
        !options.requiredRole.includes(teamMember.role)
      ) {
        // Special case: Allow viewer to perform GET requests if allowViewerRead is true
        if (
          teamMember.role === "viewer" &&
          options.allowViewerRead &&
          request.method === "GET"
        ) {
          // Viewer can proceed with read operations
        } else {
          log.warn("Insufficient permissions", {
            userId: user.id,
            userRole: teamMember.role,
            requiredRole: options.requiredRole,
            method: request.method,
          });

          return NextResponse.json(
            { error: "Insufficient permissions" },
            { status: 403 },
          );
        }
      }

      // Create context object
      const context: AuthContext = {
        user: {
          id: user.id,
          email: user.email!,
        },
        teamMember: {
          team_id: teamId,
          role: teamMember.role,
        },
      };

      // Call the handler with context
      return await handler(request, context, routeContext);
    } catch (error) {
      log.error("API middleware error", error);

      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  };
}

/**
 * Helper to check if user has write permissions
 */
export function canWrite(role: UserRole): boolean {
  return role === "master" || role === "team_mate";
}

/**
 * Helper to check if user has admin permissions
 */
export function canAdmin(role: UserRole): boolean {
  return role === "master";
}
