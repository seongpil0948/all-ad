import crypto from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";
import { getAllAdOAuthConfig } from "@/lib/oauth/platform-configs";
import log from "@/utils/logger";

export async function GET(request: NextRequest) {
  // Get locale from headers or use default
  const acceptLanguage = request.headers.get("accept-language") || "";
  const locale = acceptLanguage.startsWith("ko") ? "ko" : "en";

  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

      return NextResponse.redirect(`${baseUrl}/${locale}/login`);
    }

    // Get user's current team
    let teamId: string;

    // First check if user is a master of any team
    const { data: masterTeam } = await supabase
      .from("teams")
      .select("id")
      .eq("master_user_id", user.id)
      .single();

    if (masterTeam) {
      teamId = masterTeam.id;
    } else {
      // Check if user is a member of any team
      const { data: teamMember } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id)
        .single();

      if (teamMember) {
        teamId = teamMember.team_id;
      } else {
        // Create a new team for the user if they don't have one
        // Use service role to bypass RLS during team creation
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
          log.error("Failed to create team for user with service role", {
            userId: user.id,
            error: createError,
            errorMessage: createError.message,
            errorDetails: createError.details,
          });

          return NextResponse.json(
            { error: "Failed to create team" },
            { status: 500 },
          );
        }

        if (!newTeam) {
          return NextResponse.json(
            { error: "Team creation returned no data" },
            { status: 500 },
          );
        }

        teamId = newTeam.id;
      }
    }

    // Get Sivera's OAuth config
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
      team_id: teamId,
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
      teamId: teamId,
      redirectUri: oauthConfig.redirectUri,
    });

    return NextResponse.redirect(authUrl);
  } catch (error) {
    log.error("Error initiating Google OAuth", error);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    return NextResponse.redirect(
      `${baseUrl}/${locale}/dashboard?error=oauth_init_failed&platform=google`,
    );
  }
}
