import { NextRequest } from "next/server";

import { handleOAuthCallback } from "@/lib/auth/unified-oauth-callback";

export async function GET(request: NextRequest) {
  return handleOAuthCallback(request, "amazon");
}
