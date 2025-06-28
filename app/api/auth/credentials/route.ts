import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import { storePlatformOAuthCredentials } from "@/lib/auth/oauth-client-handler";
import { PlatformType } from "@/types";
import log from "@/utils/logger";

// Store platform OAuth credentials
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, clientId, clientSecret, developerToken, redirectUri } =
      body;

    if (!platform || !clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Get current user and team
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

    // Store the OAuth credentials
    const result = await storePlatformOAuthCredentials(
      teamId,
      platform as PlatformType,
      {
        clientId,
        clientSecret,
        developerToken,
        redirectUri,
      },
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to store credentials" },
        { status: 500 },
      );
    }

    log.info("OAuth credentials stored successfully", { platform, teamId });

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to store credentials";

    log.error("Error storing OAuth credentials", { error: errorMessage });

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
