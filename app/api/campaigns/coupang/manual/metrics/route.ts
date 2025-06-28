import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import { CoupangPlatformService } from "@/services/platforms/coupang-platform.service";
import log from "@/utils/logger";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { teamId, campaignId, date, metrics } = body;

    // Verify user has permission
    const { data: teamMember } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .single();

    if (!teamMember || teamMember.role === "viewer") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    // Get Coupang credentials
    const { data: credentials } = await supabase
      .from("platform_credentials")
      .select("*")
      .eq("team_id", teamId)
      .eq("platform", "coupang")
      .single();

    if (!credentials) {
      return NextResponse.json(
        { error: "Coupang credentials not found" },
        { status: 404 },
      );
    }

    // Create service instance
    const coupangService = new CoupangPlatformService(credentials.credentials);

    coupangService.setTeamId(teamId);

    // Update metrics
    const success = await coupangService.updateManualMetrics(
      campaignId,
      new Date(date),
      metrics,
    );

    if (!success) {
      return NextResponse.json(
        { error: "Failed to update metrics" },
        { status: 500 },
      );
    }

    log.info("Updated Coupang manual campaign metrics", {
      teamId,
      campaignId,
      date,
      metrics,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error("Error updating Coupang manual campaign metrics", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
