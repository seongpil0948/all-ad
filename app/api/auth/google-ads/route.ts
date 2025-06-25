import crypto from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import { getAllAdOAuthConfig } from "@/lib/oauth/platform-configs";
import log from "@/utils/logger";

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect("/login");
    }

    // Get user's current team
    const { data: teamMember } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .single();

    if (!teamMember) {
      return NextResponse.json(
        { error: "No team found for user" },
        { status: 400 },
      );
    }

    // Get All-AD's OAuth config
    const oauthConfig = await getAllAdOAuthConfig("google");

    if (!oauthConfig) {
      log.error("Google OAuth config not found");

      return NextResponse.json(
        { error: "OAuth configuration error" },
        { status: 500 },
      );
    }

    // Generate state for CSRF protection
    const state = crypto.randomBytes(32).toString("hex");

    // Store state in database for verification
    await supabase.from("oauth_states").insert({
      user_id: user.id,
      team_id: teamMember.team_id,
      state: state,
      platform: "google",
      created_at: new Date().toISOString(),
    });

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: oauthConfig.clientId,
      redirect_uri: oauthConfig.redirectUri,
      response_type: "code",
      scope: oauthConfig.scope.join(" "),
      access_type: "offline",
      prompt: "consent select_account",
      state: state,
      include_granted_scopes: "true",
    });

    const authUrl = `${oauthConfig.authorizationUrl}?${params.toString()}`;

    log.info("Redirecting to Google OAuth", {
      userId: user.id,
      teamId: teamMember.team_id,
      redirectUri: oauthConfig.redirectUri,
    });

    return NextResponse.redirect(authUrl);
  } catch (error) {
    log.error("Error initiating Google OAuth", error);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    return NextResponse.redirect(
      `${baseUrl}/integrated?error=oauth_init_failed&platform=google`,
    );
  }
}
