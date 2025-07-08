import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import { createTeamForUser } from "@/lib/data/teams";
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

    // Use the common team creation function
    const result = await createTeamForUser(user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message, details: result.error },
        { status: 500 },
      );
    }

    log.info("Team creation result", {
      userId: user.id,
      teamId: result.teamId,
      message: result.message,
    });

    return NextResponse.json({
      success: true,
      teamId: result.teamId,
      message: result.message,
    });
  } catch (error) {
    log.error("Error in team creation endpoint", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
