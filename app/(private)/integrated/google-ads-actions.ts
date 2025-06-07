"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { OAuthClient } from "@/lib/oauth/oauth-client";
import { getOAuthConfig } from "@/lib/oauth/platform-configs.client";
import log from "@/utils/logger";

export async function startGoogleAdsAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  try {
    // Get user's team
    const { data: teamMember } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .single();

    if (!teamMember) {
      throw new Error("Team not found");
    }

    // Get OAuth config for Google Ads
    const config = getOAuthConfig("google");
    if (!config) {
      throw new Error("Google Ads OAuth config not found");
    }

    // Create OAuth client instance
    const oauthClient = new OAuthClient("google", config);

    // Generate state with team ID
    const state = Buffer.from(
      JSON.stringify({ teamId: teamMember.team_id, platform: "google" }),
    ).toString("base64");

    // Generate OAuth URL
    const authUrl = oauthClient.getAuthorizationUrl(state);

    log.info("Starting Google Ads OAuth flow", {
      userId: user.id,
      teamId: teamMember.team_id,
    });

    redirect(authUrl);
  } catch (error) {
    log.error("Failed to start Google Ads auth", error as Error);
    redirect("/integrated?error=auth_failed&platform=google");
  }
}

export async function disconnectGoogleAds() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    // Get user's team
    const { data: teamMember } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .single();

    if (!teamMember) {
      throw new Error("Team not found");
    }

    // Deactivate Google Ads credentials
    const { error } = await supabase
      .from("platform_credentials")
      .update({ is_active: false })
      .eq("team_id", teamMember.team_id)
      .eq("platform", "google");

    if (error) {
      throw error;
    }

    log.info("Google Ads disconnected", {
      userId: user.id,
      teamId: teamMember.team_id,
    });

    return { success: true };
  } catch (error) {
    log.error("Failed to disconnect Google Ads", error as Error);
    throw error;
  }
}
