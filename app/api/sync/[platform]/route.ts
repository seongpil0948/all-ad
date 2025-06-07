import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import {
  getPlatformServiceFactory,
  getPlatformDatabaseService,
  getLogger,
} from "@/lib/di/service-resolver";
import { PlatformType } from "@/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
) {
  try {
    const { platform } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Get user's team
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

    // Get services from DI container
    const platformServiceFactory = await getPlatformServiceFactory();
    const dbService = await getPlatformDatabaseService();

    // Create platform service
    const platformService = platformServiceFactory.createService(platformType);

    // Set credentials
    platformService.setCredentials(credential.credentials);

    // Fetch campaigns from platform
    const campaigns = await platformService.fetchCampaigns();

    // Save campaigns to database
    for (const campaignData of campaigns) {
      const savedCampaign = await dbService.upsertCampaign({
        team_id: teamMember.team_id,
        platform: platformType,
        platform_campaign_id: campaignData.id,
        name: campaignData.name,
        status: campaignData.status,
        budget: campaignData.budget,
        is_active: campaignData.status === "active",
        raw_data: { ...campaignData },
      });

      // Fetch and save metrics if available
      // Check if the campaign contains metrics information
      if (savedCampaign && campaignData.metrics) {
        const metrics = campaignData.metrics;

        await dbService.upsertCampaignMetrics({
          campaign_id: savedCampaign.id, // Use the internal campaign ID
          date: new Date().toISOString().split("T")[0],
          impressions: metrics.impressions || 0,
          clicks: metrics.clicks || 0,
          conversions: metrics.conversions || 0,
          cost: metrics.cost || 0,
          revenue: metrics.revenue || 0,
          raw_data: { ...metrics },
        });
      }
    }

    // Update sync timestamp
    await supabase
      .from("platform_credentials")
      .update({ synced_at: new Date().toISOString() })
      .eq("id", credential.id);

    return NextResponse.json({
      success: true,
      message: `Synced ${campaigns.length} campaigns for ${platformType}`,
    });
  } catch (error) {
    const log = await getLogger();

    const { platform } = await params;

    log.error(
      "Sync error for platform: " + platform,
      error instanceof Error ? error : new Error(String(error)),
    );

    return NextResponse.json(
      {
        error: "Sync failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
