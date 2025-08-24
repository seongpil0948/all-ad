import { NextRequest, NextResponse } from "next/server";

import { PlatformType } from "@/types";
import { isPlatformType } from "@/utils/platform";
import { getPlatformServiceFactory } from "@/services/platforms/platform-service-factory";
import { createClient } from "@/utils/supabase/server";
import log from "@/utils/logger";

// Route params provided by Next.js are plain strings; we'll validate/narrow platform at runtime.
interface RouteParamsRaw {
  platform: string;
  campaignId: string;
}

export const runtime = "nodejs"; // Ensure Node runtime for Supabase libraries using Node APIs

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParamsRaw> },
) {
  try {
    const { platform: rawPlatform, campaignId } = await params;

    if (!isPlatformType(rawPlatform)) {
      return NextResponse.json(
        { error: "Unsupported platform" },
        { status: 400 },
      );
    }
    const platform: PlatformType = rawPlatform;

    // Get user and team info
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's team info
    const { data: teamMember, error: teamError } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .single();

    if (teamError || !teamMember) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Get platform credentials
    const { data: credentials, error: credentialsError } = await supabase
      .from("platform_credentials")
      .select("*")
      .eq("team_id", teamMember.team_id)
      .eq("platform", platform)
      .eq("is_active", true)
      .single();

    if (credentialsError || !credentials) {
      return NextResponse.json(
        { error: "Platform credentials not found" },
        { status: 404 },
      );
    }

    // Create platform service
    const factory = getPlatformServiceFactory();
    const platformService = factory.createService(platform);

    // Set credentials
    platformService.setCredentials({
      ...credentials,
      credentials: credentials.credentials as Record<string, unknown>,
    });

    // Fetch metrics for the last 30 days
    const endDate = new Date();
    const startDate = new Date();

    startDate.setDate(endDate.getDate() - 30);

    const metricsData = await platformService.fetchCampaignMetrics(
      campaignId,
      startDate,
      endDate,
    );

    log.info("Campaign metrics fetched successfully", {
      platform,
      campaignId,
      metricsCount: metricsData.length,
    });

    return NextResponse.json(metricsData);
  } catch (error) {
    log.error("Error fetching campaign metrics:", error);

    return NextResponse.json(
      { error: "Failed to fetch campaign metrics" },
      { status: 500 },
    );
  }
}
