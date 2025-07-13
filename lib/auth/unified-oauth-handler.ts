import "server-only";

import crypto from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";
import { getAllAdOAuthConfig } from "@/lib/oauth/platform-configs";
import { OAUTH_CONFIGS } from "@/lib/auth/oauth-handlers";
import { PlatformType } from "@/types";
import log from "@/utils/logger";

interface OAuthConfigOverride {
  scopes?: string[];
  additionalParams?: Record<string, string>;
  requiresTeam?: boolean;
}

// Platform-specific OAuth configurations
const PLATFORM_OVERRIDES: Record<PlatformType, OAuthConfigOverride> = {
  google: {
    additionalParams: {
      access_type: "offline",
      prompt: "consent select_account",
      include_granted_scopes: "true",
    },
  },
  facebook: {
    additionalParams: {
      access_type: "offline",
    },
  },
  kakao: {
    additionalParams: {},
  },
  amazon: {
    scopes: ["profile"], // Start with basic profile scope
    additionalParams: {},
  },
  naver: {
    additionalParams: {},
  },
  coupang: {
    additionalParams: {},
  },
};

export async function handleOAuthInitiation(
  request: NextRequest,
  platform: PlatformType,
): Promise<NextResponse> {
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

    // Get or create team for user
    const teamId = await getOrCreateUserTeam(user.id, user.email);

    if (!teamId) {
      return NextResponse.json(
        { error: "Failed to get or create team" },
        { status: 500 },
      );
    }

    // Get OAuth configuration
    const authUrl = await buildOAuthUrl(platform, user.id, teamId);

    log.info(`Redirecting to ${platform} OAuth`, {
      userId: user.id,
      teamId: teamId,
      platform,
    });

    return NextResponse.redirect(authUrl);
  } catch (error) {
    log.error(`Error initiating ${platform} OAuth`, error);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    return NextResponse.redirect(
      `${baseUrl}/${locale}/dashboard?error=oauth_init_failed&platform=${platform}`,
    );
  }
}

async function getOrCreateUserTeam(
  userId: string,
  userEmail: string | undefined,
): Promise<string | null> {
  const supabase = await createClient();

  // First check if user is a master of any team
  const { data: masterTeam } = await supabase
    .from("teams")
    .select("id")
    .eq("master_user_id", userId)
    .single();

  if (masterTeam) {
    return masterTeam.id;
  }

  // Check if user is a member of any team
  const { data: teamMember } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId)
    .single();

  if (teamMember) {
    return teamMember.team_id;
  }

  // Create a new team for the user if they don't have one
  // Use service role to bypass RLS during team creation
  const serviceClient = createServiceClient();

  const { data: newTeam, error: createError } = await serviceClient
    .from("teams")
    .insert({
      name: userEmail || "My Team",
      master_user_id: userId,
    })
    .select("id")
    .single();

  if (createError) {
    log.error("Failed to create team for user with service role", {
      userId: userId,
      error: createError,
      errorMessage: createError.message,
      errorDetails: createError.details,
    });

    return null;
  }

  return newTeam?.id || null;
}

async function buildOAuthUrl(
  platform: PlatformType,
  userId: string,
  teamId: string,
): Promise<string> {
  const supabase = await createClient();

  // Generate state for CSRF protection
  const state = crypto.randomBytes(32).toString("hex");

  // Store state in database for verification
  await supabase.from("oauth_states").insert({
    user_id: userId,
    team_id: teamId,
    state: state,
    platform: platform,
    created_at: new Date().toISOString(),
  });

  // Get platform configuration
  const override = PLATFORM_OVERRIDES[platform];

  // For Google, use All-AD's OAuth config
  if (platform === "google") {
    const oauthConfig = await getAllAdOAuthConfig("google");

    if (!oauthConfig) {
      throw new Error("Google OAuth config not found");
    }

    const params = new URLSearchParams({
      client_id: oauthConfig.clientId,
      redirect_uri: oauthConfig.redirectUri,
      response_type: "code",
      scope: oauthConfig.scope.join(" "),
      state: state,
      ...override.additionalParams,
    });

    return `${oauthConfig.authorizationUrl}?${params.toString()}`;
  }

  // For other platforms, use environment variables and standard config
  const config = OAUTH_CONFIGS[platform];

  if (!config.authUrl) {
    throw new Error(`OAuth not supported for platform: ${platform}`);
  }

  // Get platform-specific environment variables
  const clientId = getClientId(platform);
  const redirectUri = getRedirectUri(platform);

  if (!clientId) {
    throw new Error(`Client ID not configured for platform: ${platform}`);
  }

  // Use override scopes if available, otherwise use default config scopes
  const scopes = override.scopes || config.scopes;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    state: state,
    ...override.additionalParams,
  });

  // Only add scope if we have scopes defined
  if (scopes.length > 0) {
    params.set("scope", scopes.join(" "));
  }

  return `${config.authUrl}?${params.toString()}`;
}

function getClientId(platform: PlatformType): string | undefined {
  switch (platform) {
    case "amazon":
      return process.env.AMAZON_CLIENT_ID;
    case "facebook":
      return process.env.META_APP_ID;
    case "kakao":
      return process.env.KAKAO_CLIENT_ID;
    case "naver":
      return process.env.NAVER_CLIENT_ID;
    case "coupang":
      return process.env.COUPANG_CLIENT_ID;
    default:
      return undefined;
  }
}

function getRedirectUri(platform: PlatformType): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return `${baseUrl}/api/auth/callback/${platform}-ads`;
}

export { PLATFORM_OVERRIDES };
