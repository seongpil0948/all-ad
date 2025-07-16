import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import log from "@/utils/logger";

// Delete platform credential (disconnect platform)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ credentialId: string }> },
) {
  try {
    const { credentialId } = await params;

    if (!credentialId) {
      return NextResponse.json(
        { error: "Credential ID is required" },
        { status: 400 },
      );
    }

    // Get current user
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

    // Verify the credential belongs to the user's team
    const { data: credential, error: credentialError } = await supabase
      .from("platform_credentials")
      .select("id, platform, account_name, team_id")
      .eq("id", credentialId)
      .eq("team_id", teamId)
      .single();

    if (credentialError || !credential) {
      return NextResponse.json(
        { error: "Credential not found or access denied" },
        { status: 404 },
      );
    }

    // Check if user has permission to disconnect (master or team_mate role)
    const { data: teamMember } = await supabase
      .from("team_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("team_id", teamId)
      .single();

    // Check if user is team master
    const { data: team } = await supabase
      .from("teams")
      .select("master_user_id")
      .eq("id", teamId)
      .single();

    const isTeamMaster = team?.master_user_id === user.id;
    const hasPermission =
      isTeamMaster ||
      (teamMember && ["master", "team_mate"].includes(teamMember.role));

    if (!hasPermission) {
      return NextResponse.json(
        { error: "Insufficient permissions to disconnect platform" },
        { status: 403 },
      );
    }

    // Delete the credential
    const { error: deleteError } = await supabase
      .from("platform_credentials")
      .delete()
      .eq("id", credentialId);

    if (deleteError) {
      log.error("Failed to delete platform credential", {
        credentialId,
        error: deleteError,
      });

      return NextResponse.json(
        { error: "Failed to disconnect platform" },
        { status: 500 },
      );
    }

    // Also delete related campaigns and metrics
    const { error: campaignsError } = await supabase
      .from("campaigns")
      .delete()
      .eq("team_id", teamId)
      .eq("platform", credential.platform);

    if (campaignsError) {
      log.warn("Failed to delete related campaigns", {
        platform: credential.platform,
        teamId,
        error: campaignsError,
      });
      // Don't fail the request, just log the warning
    }

    log.info("Platform disconnected successfully", {
      credentialId,
      platform: credential.platform,
      accountName: credential.account_name,
      teamId,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: `${credential.platform} account disconnected successfully`,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to disconnect platform";

    const resolvedParams = await params;

    log.error("Platform disconnect error", {
      credentialId: resolvedParams.credentialId,
      error: errorMessage,
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
