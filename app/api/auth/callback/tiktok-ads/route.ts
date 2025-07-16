import { NextRequest } from "next/server";

import { handleUnifiedOAuthCallback } from "@/lib/oauth/unified-oauth-handler";
import { PlatformType } from "@/types";

export async function GET(request: NextRequest) {
  // TikTok Ads OAuth callback implementation
  return handleUnifiedOAuthCallback(request, {
    platform: "tiktok" as PlatformType,
    environment: "lab",
  });
}
