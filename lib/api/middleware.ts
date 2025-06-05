import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import { UserRole } from "@/types/database.types";
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
          error: authError,
        });

        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Get user's team membership
      const { data: teamMember, error: teamError } = await supabase
        .from("team_members")
        .select("team_id, role")
        .eq("user_id", user.id)
        .single();

      if (teamError || !teamMember) {
        log.warn("Team not found for user", {
          userId: user.id,
          error: teamError,
        });

        return NextResponse.json({ error: "Team not found" }, { status: 404 });
      }

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
        teamMember,
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
