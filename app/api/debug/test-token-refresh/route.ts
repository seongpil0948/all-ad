import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import { OAuthManager } from "@/lib/oauth/oauth-manager";
import { getOAuthConfigWithCredentials } from "@/lib/oauth/platform-configs";
import { getRedisClient } from "@/lib/redis";
import log from "@/utils/logger";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { platform, accountId } = body;

    if (!platform) {
      return NextResponse.json(
        { error: "Platform is required" },
        { status: 400 },
      );
    }

    // Get team for user
    const { data: teamMember } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .single();

    if (!teamMember) {
      return NextResponse.json({ error: "No team found" }, { status: 404 });
    }

    // Get platform credentials
    const { data: credential } = await supabase
      .from("platform_credentials")
      .select("*")
      .eq("team_id", teamMember.team_id)
      .eq("platform", platform)
      .single();

    if (!credential) {
      return NextResponse.json(
        { error: `No credentials found for ${platform}` },
        { status: 404 },
      );
    }

    // Get OAuth config
    const oauthConfig = await getOAuthConfigWithCredentials(
      platform,
      teamMember.team_id,
    );

    if (!oauthConfig) {
      return NextResponse.json(
        { error: "OAuth config not found" },
        { status: 404 },
      );
    }

    // Create OAuth manager
    const oauthManager = new OAuthManager(platform, oauthConfig);

    // Get current token from Redis
    const redis = await getRedisClient();
    const tokenKey = `oauth:${platform}:${user.id}:${accountId || credential.account_id}:tokens`;
    const currentTokenData = await redis.get(tokenKey);

    let tokenInfo = null;
    let refreshResult = null;

    if (currentTokenData) {
      try {
        const parsedToken = JSON.parse(currentTokenData);

        tokenInfo = {
          hasToken: true,
          expiresAt: new Date(parsedToken.expires_at).toISOString(),
          hasRefreshToken: !!parsedToken.refresh_token,
          isExpired: parsedToken.expires_at < Date.now(),
        };

        // Try to get a valid access token (will refresh if needed)
        const validToken = await oauthManager.getValidAccessToken(
          user.id,
          accountId || credential.account_id,
        );

        if (validToken) {
          // Get updated token info
          const updatedTokenData = await redis.get(tokenKey);
          const updatedToken = updatedTokenData
            ? JSON.parse(updatedTokenData)
            : null;

          refreshResult = {
            success: true,
            newExpiresAt: updatedToken
              ? new Date(updatedToken.expires_at).toISOString()
              : null,
            tokenRefreshed:
              updatedToken &&
              updatedToken.expires_at !== parsedToken.expires_at,
          };
        } else {
          refreshResult = {
            success: false,
            error: "Failed to get valid access token",
          };
        }
      } catch (error) {
        log.error("Token refresh test failed:", error);
        refreshResult = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    } else {
      tokenInfo = { hasToken: false };
      refreshResult = {
        success: false,
        error: "No token found in Redis",
      };
    }

    return NextResponse.json({
      platform,
      accountId: accountId || credential.account_id,
      tokenKey,
      tokenInfo,
      refreshResult,
      credentialInfo: {
        isActive: credential.is_active,
        lastSyncedAt: credential.last_synced_at,
        hasClientId: !!credential.credentials?.client_id,
        hasClientSecret: !!credential.credentials?.client_secret,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    log.error("Token refresh test failed:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
