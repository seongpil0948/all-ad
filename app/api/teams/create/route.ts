import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";
import log from "@/utils/logger";

export async function POST() {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user already has a team
    const { data: existingTeam } = await supabase
      .from("teams")
      .select("id")
      .eq("master_user_id", user.id)
      .single();

    if (existingTeam) {
      return NextResponse.json({
        success: true,
        teamId: existingTeam.id,
        message: "User already has a team",
      });
    }

    // Use service role client to bypass RLS
    const serviceClient = createServiceClient();

    const { data: newTeam, error: createError } = await serviceClient
      .from("teams")
      .insert({
        name: user.email || "My Team",
        master_user_id: user.id,
      })
      .select("id")
      .single();

    if (createError) {
      log.error("Failed to create team with service role", {
        userId: user.id,
        error: createError,
      });

      return NextResponse.json(
        { error: "Failed to create team", details: createError.message },
        { status: 500 },
      );
    }

    log.info("Team created successfully", {
      userId: user.id,
      teamId: newTeam.id,
    });

    return NextResponse.json({
      success: true,
      teamId: newTeam.id,
      message: "Team created successfully",
    });
  } catch (error) {
    log.error("Error in team creation endpoint", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
