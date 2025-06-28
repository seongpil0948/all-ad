import { NextRequest } from "next/server";

import { handleUnifiedOAuthCallback } from "@/lib/oauth/unified-oauth-handler";

export async function GET(request: NextRequest) {
  return handleUnifiedOAuthCallback(request, {
    platform: "google",
    environment: "lab",
  });
}
