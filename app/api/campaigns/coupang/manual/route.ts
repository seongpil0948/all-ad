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
    const { teamId, externalId, name, status, budget, notes } = body;

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

    // Get Coupang credentials (even if just for validation)
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

    // Create manual campaign
    const success = await coupangService.createManualCampaign({
      externalId,
      name,
      status: status as "active" | "paused" | "ended",
      budget,
      notes,
    });

    if (!success) {
      return NextResponse.json(
        { error: "Failed to create campaign" },
        { status: 500 },
      );
    }

    log.info("Created Coupang manual campaign", { teamId, externalId, name });

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error("Error creating Coupang manual campaign", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("teamId");

    if (!teamId) {
      return NextResponse.json({ error: "Team ID required" }, { status: 400 });
    }

    // Verify user has permission
    const { data: teamMember } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .single();

    if (!teamMember) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    // Fetch manual campaigns
    const { data: campaigns, error } = await supabase
      .from("manual_campaigns")
      .select("*")
      .eq("team_id", teamId)
      .eq("platform", "coupang")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ campaigns });
  } catch (error) {
    log.error("Error fetching Coupang manual campaigns", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
