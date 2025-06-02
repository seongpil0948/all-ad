import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import { platformServiceFactory } from "@/services/platforms/platform-service-factory";
import { PlatformType } from "@/types/platform";
import log from "@/utils/logger";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string; campaignId: string }> },
) {
  try {
    const { platform, campaignId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { is_active } = await request.json();

    if (typeof is_active !== "boolean") {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 },
      );
    }

    const platformType = platform as PlatformType;

    const validPlatforms: PlatformType[] = [
      "facebook",
      "google",
      "kakao",
      "naver",
      "coupang",
    ];

    if (!validPlatforms.includes(platformType)) {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    }

    // Get user's team and check permissions
    const { data: teamMember, error: teamError } = await supabase
      .from("team_members")
      .select("team_id, role")
      .eq("user_id", user.id)
      .single();

    if (teamError || !teamMember) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (teamMember.role === "viewer") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    // Get platform credentials
    const { data: credential, error: credError } = await supabase
      .from("platform_credentials")
      .select("*")
      .eq("team_id", teamMember.team_id)
      .eq("platform", platformType)
      .eq("is_active", true)
      .single();

    if (credError || !credential) {
      return NextResponse.json(
        { error: "Platform credentials not found" },
        { status: 404 },
      );
    }

    // Update status in the platform
    const platformService = platformServiceFactory.createService(platformType);

    await platformService.setCredentials(credential.credentials);

    try {
      const success = await platformService.updateCampaignStatus(
        campaignId,
        is_active,
      );

      if (!success) {
        throw new Error("Failed to update status on platform");
      }

      // Update status in our database
      const { error: updateError } = await supabase
        .from("campaigns")
        .update({
          is_active,
          status: is_active ? "ACTIVE" : "PAUSED",
          updated_at: new Date().toISOString(),
        })
        .eq("team_id", teamMember.team_id)
        .eq("platform", platformType)
        .eq("platform_campaign_id", campaignId);

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json({
        success: true,
        message: "Campaign status updated successfully",
        is_active,
      });
    } catch (error) {
      log.error(`Status update error for ${platformType}: ${error}`);

      return NextResponse.json(
        {
          error: "Failed to update status",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    log.error(`Status API error:${error}`);

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
