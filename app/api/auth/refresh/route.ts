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

    // Get user's team - check if user is master of a team
    const { data: masterTeam } = await supabase
      .from("teams")
      .select("id")
      .eq("master_user_id", user.id)
      .single();

    let teamId: string | null = null;

    if (masterTeam) {
      teamId = masterTeam.id;
    } else {
      // Check if user is a member of any team
      const { data: membership } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (membership) {
        teamId = membership.team_id;
      }
    }

    if (!teamId) {
      // Create team if doesn't exist
      const { data: newTeamId, error: createError } = await supabase.rpc(
        "create_team_for_user",
        { user_id: user.id },
      );

      if (createError || !newTeamId) {
        log.error("Failed to create team", { error: createError });

        return NextResponse.json(
          { error: "Failed to create team" },
          { status: 500 },
        );
      }

      teamId = newTeamId;
    }

    // Ensure teamId is not null
    if (!teamId) {
      return NextResponse.json(
        { error: "Failed to get or create team" },
        { status: 500 },
      );
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { platform, accountId } = body as {
      platform?: PlatformType;
      accountId?: string;
    };

    // If specific account is provided, refresh only that account
    if (accountId && platform) {
      // Get the specific credential
      const { data: credential } = await supabase
        .from("platform_credentials")
        .select("*")
        .eq("team_id", teamId)
        .eq("platform", platform)
        .eq("account_id", accountId)
        .single();

      if (!credential) {
        return NextResponse.json(
          { error: "Credential not found" },
          { status: 404 },
        );
      }

      // Refresh single credential
      const tokenRefreshResult =
        await tokenRefreshService.refreshSingleCredential({
          id: credential.id,
          platform: credential.platform as PlatformType,
          refresh_token: credential.refresh_token,
          access_token: credential.access_token,
          account_name: credential.account_name,
          team_id: credential.team_id,
          credentials: credential.credentials,
        });

      return NextResponse.json({
        success: tokenRefreshResult.success,
        message: tokenRefreshResult.success
          ? "Token refreshed successfully"
          : tokenRefreshResult.error,
        error: tokenRefreshResult.error,
      });
    }

    // Otherwise, refresh all credentials for the team (and platform if specified)
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
export async function GET(request: NextRequest) {
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

    // Get user's team - check if user is master of a team
    const { data: masterTeam } = await supabase
      .from("teams")
      .select("id")
      .eq("master_user_id", user.id)
      .single();

    let teamId: string | null = null;

    if (masterTeam) {
      teamId = masterTeam.id;
    } else {
      // Check if user is a member of any team
      const { data: membership } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (membership) {
        teamId = membership.team_id;
      }
    }

    if (!teamId) {
      // Create team if doesn't exist
      const { data: newTeamId, error: createError } = await supabase.rpc(
        "create_team_for_user",
        { user_id: user.id },
      );

      if (createError || !newTeamId) {
        log.error("Failed to create team", { error: createError });

        return NextResponse.json(
          { error: "Failed to create team" },
          { status: 500 },
        );
      }

      teamId = newTeamId;
    }

    // Ensure teamId is not null
    if (!teamId) {
      return NextResponse.json(
        { error: "Failed to get or create team" },
        { status: 500 },
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const platform = url.searchParams.get("platform") as PlatformType | null;
    const accountId = url.searchParams.get("accountId");

    // If checking a specific account, validate its token
    if (platform && accountId) {
      try {
        const { data: credential } = await supabase
          .from("platform_credentials")
          .select("*")
          .eq("team_id", teamId)
          .eq("platform", platform)
          .eq("account_id", accountId)
          .single();

        if (!credential) {
          return NextResponse.json({
            success: false,
            error: "Credential not found",
          });
        }

        // Check if credential needs refresh
        const { needsRefresh } = await import("@/lib/auth/platform-auth");
        const credentialNeedsRefresh = needsRefresh(credential);

        return NextResponse.json({
          success: !credentialNeedsRefresh,
          hasValidToken: !credentialNeedsRefresh,
        });
      } catch {
        return NextResponse.json({
          success: false,
          error: "Token validation failed",
        });
      }
    }

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
