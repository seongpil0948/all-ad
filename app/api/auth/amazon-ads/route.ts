import { NextRequest } from "next/server";

import { handleOAuthInitiation } from "@/lib/auth/unified-oauth-handler";

export async function GET(request: NextRequest) {
  return handleOAuthInitiation(request, "amazon");
}
