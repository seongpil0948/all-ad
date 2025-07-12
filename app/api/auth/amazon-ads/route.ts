import crypto from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

const AMAZON_AUTH_URL = "https://www.amazon.com/ap/oa";
// For Login with Amazon, we need to request basic profile permissions first
// The scope should be empty or use "profile" only if the app is registered for LWA
const REQUIRED_SCOPES = ["profile"];

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 사용자의 팀 정보 조회
    const { data: teamMember } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .single();

    if (!teamMember?.team_id) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // OAuth state 생성
    const state = crypto.randomBytes(32).toString("hex");

    // OAuth state를 DB에 저장
    await supabase.from("oauth_states").insert({
      user_id: user.id,
      team_id: teamMember.team_id,
      platform: "amazon",
      state,
    });

    // Amazon OAuth URL 생성
    // Try without scope first - some LWA apps don't support explicit scopes
    const params = new URLSearchParams({
      client_id: process.env.AMAZON_CLIENT_ID!,
      response_type: "code",
      redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback/amazon-ads`,
      state,
    });

    // Only add scope if we have one defined
    if (REQUIRED_SCOPES.length > 0) {
      params.set("scope", REQUIRED_SCOPES.join(" "));
    }

    const authUrl = `${AMAZON_AUTH_URL}?${params.toString()}`;

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Amazon Ads OAuth initiation error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
