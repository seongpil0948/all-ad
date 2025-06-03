import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import { platformServiceFactory } from "@/services/platforms/platform-service-factory";
import { PlatformType } from "@/types";
import log from "@/utils/logger";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string; campaignId: string }> },
) {
  const { platform, campaignId } = await params;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { budget } = await request.json();

    if (!budget || isNaN(budget) || budget < 0) {
      return NextResponse.json(
        { error: "Invalid budget value" },
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

    // Update budget in the platform
    const platformService = platformServiceFactory.createService(platformType);

    await platformService.setCredentials(credential.credentials);

    try {
      const success = await platformService.updateCampaignBudget(
        campaignId,
        budget,
      );

      if (!success) {
        throw new Error("Failed to update budget on platform");
      }

      // Update budget in our database
      const { error: updateError } = await supabase
        .from("campaigns")
        .update({
          budget,
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
        message: "Budget updated successfully",
        budget,
      });
    } catch (error) {
      log.error(
        `Budget update error for ${platformType}: ${JSON.stringify(error)}`,
      );

      return NextResponse.json(
        {
          error: "Failed to update budget",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    log.error(
      `Error in PUT /campaigns/${platform}/${campaignId}/budget: ${JSON.stringify(error)}`,
    );

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
