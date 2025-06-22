import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import { tokenRefreshService } from "@/lib/auth/token-refresh-service";
import { PlatformType } from "@/types";
import log from "@/utils/logger";

// Manual token refresh endpoint
export async function POST(request: NextRequest) {
  try {
    // Get current user and team
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Get user's current team
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("current_team_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.current_team_id) {
      return NextResponse.json({ error: "Team not found" }, { status: 400 });
    }

    const teamId = profile.current_team_id;

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { platform } = body as { platform?: PlatformType };

    // Trigger token refresh for the team (and platform if specified)
    const result = await tokenRefreshService.refreshPlatformCredentials(
      teamId,
      platform,
    );

    log.info("Manual token refresh completed", {
      teamId,
      platform,
      ...result,
    });

    return NextResponse.json({
      success: true,
      ...result,
      message: `Successfully refreshed ${result.successful} credential(s)`,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Token refresh failed";
    const errorStack = error instanceof Error ? error.stack : undefined;

    log.error("Manual token refresh failed", {
      error: errorMessage,
      stack: errorStack,
    });

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}

// Get token refresh status
export async function GET(_request: NextRequest) {
  try {
    // Get current user and team
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Get user's current team
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("current_team_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.current_team_id) {
      return NextResponse.json({ error: "Team not found" }, { status: 400 });
    }

    const teamId = profile.current_team_id;

    // Get platform credentials that need refresh
    const { getPlatformCredentials, needsRefresh } = await import(
      "@/lib/auth/platform-auth"
    );
    const credentials = await getPlatformCredentials(teamId);

    const credentialsNeedingRefresh = credentials.filter(needsRefresh);
    const refreshServiceStatus = tokenRefreshService.getStatus();

    return NextResponse.json({
      totalCredentials: credentials.length,
      credentialsNeedingRefresh: credentialsNeedingRefresh.length,
      refreshService: refreshServiceStatus,
      credentials: credentials.map((cred) => ({
        id: cred.id,
        platform: cred.platform,
        accountName: cred.account_name,
        isActive: cred.is_active,
        needsRefresh: needsRefresh(cred),
        hasError: !!cred.error_message,
        errorMessage: cred.error_message,
        lastSync: cred.last_sync_at,
        expiresAt: cred.expires_at,
      })),
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get status";

    log.error("Failed to get refresh status", {
      error: errorMessage,
    });

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
