import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Redirect to new unified TikTok OAuth callback
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const newUrl = new URL(`${baseUrl}/api/auth/oauth/tiktok/callback`);

  if (code) newUrl.searchParams.set("code", code);
  if (state) newUrl.searchParams.set("state", state);
  if (error) newUrl.searchParams.set("error", error);

  return NextResponse.redirect(newUrl.toString());
}
