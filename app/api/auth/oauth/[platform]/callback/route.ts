import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import {
  exchangeCodeForTokens,
  getPlatformAccountInfo,
} from "@/lib/auth/oauth-handlers";
import {
  getPlatformOAuthCredentials,
  updatePlatformOAuthConnection,
} from "@/lib/auth/oauth-client-handler";
import { PlatformType } from "@/types";
import log from "@/utils/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform: platformParam } = await params;
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const platform = platformParam.toUpperCase() as PlatformType;

  // Handle OAuth errors
  if (error) {
    log.error("OAuth error received", { platform, error });

    return redirect(
      `/settings/integrations?error=oauth_cancelled&platform=${platform.toLowerCase()}`,
    );
  }

  // Validate required parameters
  if (!code || !state) {
    log.error("Missing OAuth parameters", {
      platform,
      hasCode: !!code,
      hasState: !!state,
    });

    return redirect(
      `/settings/integrations?error=invalid_oauth_response&platform=${platform.toLowerCase()}`,
    );
  }

  try {
    // Get current user and team
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      log.error("User not authenticated during OAuth callback", {
        platform,
        authError,
      });

      return redirect("/login?error=authentication_required");
    }

    // Get user's current team
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("current_team_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.current_team_id) {
      log.error("Could not find user's team", {
        platform,
        userId: user.id,
        profileError,
      });

      return redirect("/settings/integrations?error=team_not_found");
    }

    const teamId = profile.current_team_id;
    const platformLower = platformParam.toLowerCase() as PlatformType;

    // Get user's OAuth credentials
    const oauthCredentials = await getPlatformOAuthCredentials(
      teamId,
      platformLower,
    );

    if (!oauthCredentials) {
      log.error("OAuth credentials not found", {
        platform: platformLower,
        teamId,
      });

      return redirect(
        `/settings/integrations?error=oauth_credentials_missing&platform=${platformLower}`,
      );
    }

    // Important: Use the exact same redirect URI that was used during OAuth initiation
    // This must match the registered redirect URI in Google Console
    const redirectUri = oauthCredentials.redirectUri;

    log.info("OAuth callback processing", {
      platform: platformLower,
      redirectUri,
      hasCode: !!code,
      hasState: !!state,
      hasCredentials: !!oauthCredentials,
    });

    // Exchange authorization code for tokens
    const tokens = await exchangeCodeForTokens(
      platformLower,
      code,
      state,
      redirectUri,
      oauthCredentials.clientId,
      oauthCredentials.clientSecret,
    );

    // Get platform account information
    const accountInfo = await getPlatformAccountInfo(
      platformLower,
      tokens.access_token,
    );

    // Calculate expiry time
    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : undefined;

    // Update the platform credential with tokens and account info
    const { success, error: updateError } = await updatePlatformOAuthConnection(
      teamId,
      platformLower,
      accountInfo.accountId,
      accountInfo.accountName,
      {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
        scope: tokens.scope,
      },
    );

    if (!success) {
      log.error("Failed to update OAuth connection", {
        platform: platformLower,
        error: updateError,
      });
      throw new Error(updateError || "Failed to save OAuth tokens");
    }

    log.info("OAuth integration successful", {
      platform,
      teamId,
      accountId: accountInfo.accountId,
      accountName: accountInfo.accountName,
    });

    // Redirect to integrations page with success message
    return redirect(
      `/settings/integrations?success=platform_connected&platform=${platform.toLowerCase()}&account=${encodeURIComponent(accountInfo.accountName)}`,
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    const errorStack = error instanceof Error ? error.stack : undefined;

    log.error("OAuth callback failed", {
      platform,
      error: errorMessage,
      stack: errorStack,
    });

    // Redirect with error message
    const encodedMessage = encodeURIComponent(errorMessage);

    return redirect(
      `/settings/integrations?error=oauth_failed&platform=${platform.toLowerCase()}&message=${encodedMessage}`,
    );
  }
}

// Handle OAuth initiation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform: platformParam } = await params;

  try {
    const platform = platformParam.toLowerCase() as PlatformType;

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

    // Get user's OAuth credentials
    const { getPlatformOAuthCredentials } = await import(
      "@/lib/auth/oauth-client-handler"
    );
    const oauthCredentials = await getPlatformOAuthCredentials(
      teamId,
      platform,
    );

    if (!oauthCredentials) {
      return NextResponse.json(
        {
          error:
            "OAuth credentials not configured. Please add your API credentials first.",
        },
        { status: 400 },
      );
    }

    log.info("OAuth initiation", {
      platform,
      redirectUri: oauthCredentials.redirectUri,
      hasCredentials: true,
    });

    // Generate OAuth URL
    const { generateOAuthUrl } = await import("@/lib/auth/oauth-handlers");
    const authUrl = await generateOAuthUrl(
      platform,
      teamId,
      oauthCredentials.redirectUri,
      oauthCredentials.clientId,
    );

    return NextResponse.json({ authUrl });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to initiate OAuth";

    log.error("OAuth initiation failed", {
      platform: platformParam,
      error: errorMessage,
    });

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
