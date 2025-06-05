import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import log from "@/utils/logger";
import { transformDbCampaignToApp } from "@/utils/campaign-transformer";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's team
    const { data: teamMember, error: teamError } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .single();

    if (teamError || !teamMember) {
      log.error("Team not found for user", {
        userId: user.id,
        error: teamError,
      });

      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform");
    const status = searchParams.get("status");

    // Build query
    let query = supabase
      .from("campaigns")
      .select("*")
      .eq("team_id", teamMember.team_id);

    if (platform) {
      query = query.eq("platform", platform);
    }

    if (status !== null) {
      query = query.eq("is_active", status === "active");
    }

    const { data: campaigns, error: campaignsError } = await query.order(
      "updated_at",
      { ascending: false },
    );

    if (campaignsError) {
      log.error("Error fetching campaigns", { error: campaignsError });

      return NextResponse.json(
        { error: "Failed to fetch campaigns" },
        { status: 500 },
      );
    }

    // Calculate stats
    const stats = {
      totalCampaigns: campaigns?.length || 0,
      activeCampaigns: campaigns?.filter((c) => c.is_active).length || 0,
      totalSpend: campaigns?.reduce((sum, c) => sum + (c.spend || 0), 0) || 0,
      totalClicks: campaigns?.reduce((sum, c) => sum + (c.clicks || 0), 0) || 0,
      totalImpressions:
        campaigns?.reduce((sum, c) => sum + (c.impressions || 0), 0) || 0,
      averageCTR: 0,
      averageCPC: 0,
    };

    if (stats.totalImpressions > 0) {
      stats.averageCTR = (stats.totalClicks / stats.totalImpressions) * 100;
    }
    if (stats.totalClicks > 0) {
      stats.averageCPC = stats.totalSpend / stats.totalClicks;
    }

    const transformedCampaigns = (campaigns || []).map(
      transformDbCampaignToApp,
    );

    return NextResponse.json({
      campaigns: transformedCampaigns,
      stats,
    });
  } catch (error) {
    log.error("Unexpected error in GET /api/campaigns", { error });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
