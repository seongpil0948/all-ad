import { NextRequest, NextResponse } from "next/server";

import { handleOAuthInitiation } from "@/lib/auth/unified-oauth-handler";
import { PlatformType } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params;

  // Validate platform
  const validPlatforms: PlatformType[] = [
    "google",
    "facebook",
    "kakao",
    "amazon",
    "naver",
    "coupang",
    "tiktok",
  ];

  if (!validPlatforms.includes(platform as PlatformType)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  return handleOAuthInitiation(request, platform as PlatformType);
}
