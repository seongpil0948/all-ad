import { NextRequest, NextResponse } from "next/server";

import { getRedisClient } from "@/lib/redis";
import { createClient } from "@/utils/supabase/server";
import log from "@/utils/logger";

export async function GET(_request: NextRequest) {
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

    // Get team for user
    const { data: teamMember } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .single();

    if (!teamMember) {
      return NextResponse.json({ error: "No team found" }, { status: 404 });
    }

    // Get all platform credentials for the team
    const { data: credentials, error: credError } = await supabase
      .from("platform_credentials")
      .select("*")
      .eq("team_id", teamMember.team_id);

    if (credError) {
      throw credError;
    }

    // Check Redis for tokens
    const redis = await getRedisClient();
    const tokenStatus = [];

    for (const cred of credentials || []) {
      const tokenKey = `oauth:${cred.platform}:${cred.user_id}:${cred.account_id}:tokens`;
      const tokenData = await redis.get(tokenKey);

      let parsedToken = null;
      let tokenInfo = null;

      if (tokenData) {
        try {
          parsedToken = JSON.parse(tokenData);
          const expiresAt = new Date(parsedToken.expires_at);
          const now = new Date();
          const isExpired = expiresAt < now;
          const expiresIn = Math.floor(
            (expiresAt.getTime() - now.getTime()) / 1000,
          );

          tokenInfo = {
            hasToken: true,
            isExpired,
            expiresAt: expiresAt.toISOString(),
            expiresIn: isExpired ? 0 : expiresIn,
            hasRefreshToken: !!parsedToken.refresh_token,
            tokenType: parsedToken.token_type,
            scope: parsedToken.scope,
          };
        } catch (e) {
          log.error("Failed to parse token data:", e);
          tokenInfo = { hasToken: false, error: "Invalid token format" };
        }
      } else {
        tokenInfo = { hasToken: false };
      }

      tokenStatus.push({
        platform: cred.platform,
        accountId: cred.account_id,
        accountName: cred.account_name,
        isActive: cred.is_active,
        lastSyncedAt: cred.last_synced_at,
        redisKey: tokenKey,
        tokenInfo,
        credentialData: cred.data, // This might contain connection status
      });
    }

    // Also check Redis connection
    const redisInfo = await redis.ping();

    return NextResponse.json({
      success: true,
      redisConnected: redisInfo === "PONG",
      teamId: teamMember.team_id,
      userId: user.id,
      credentials: tokenStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    log.error("Redis token debug failed:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// POST endpoint to manually refresh tokens
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

    if (!platform || !accountId) {
      return NextResponse.json(
        { error: "Platform and accountId are required" },
        { status: 400 },
      );
    }

    // Trigger token refresh for specific account
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/cron/refresh-tokens`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.CRON_SECRET || ""}`,
        },
      },
    );

    const result = await response.json();

    return NextResponse.json({
      success: true,
      refreshResult: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    log.error("Manual token refresh failed:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
