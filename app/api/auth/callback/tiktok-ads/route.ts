import { NextRequest } from "next/server";

import { handleUnifiedOAuthCallback } from "@/lib/oauth/unified-oauth-handler";
import { PlatformType } from "@/types/base.types";

export async function GET(request: NextRequest) {
  // This route is currently used for lab environment redirects
  // Using 'google' as placeholder since 'tiktok' is not in PlatformType yet
  return handleUnifiedOAuthCallback(request, {
    platform: "google" as PlatformType, // TODO: Add 'tiktok' to PlatformType when implementing TikTok Ads
    environment: "lab",
  });
}
