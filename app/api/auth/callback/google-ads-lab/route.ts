import { NextRequest, NextResponse } from "next/server";

import log from "@/utils/logger";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Build redirect URL with parameters
    const labUrl = new URL("/lab", request.url);

    if (error) {
      log.error("Google Ads Lab OAuth error", { error });
      labUrl.searchParams.set("error", error);
    } else if (code) {
      labUrl.searchParams.set("code", code);
      if (state) {
        labUrl.searchParams.set("state", state);
      }
    } else {
      labUrl.searchParams.set("error", "missing_code");
    }

    // Redirect back to lab page with OAuth response
    return NextResponse.redirect(labUrl);
  } catch (error) {
    log.error("Google Ads Lab OAuth callback error", { error });

    const errorUrl = new URL("/lab", request.url);
    errorUrl.searchParams.set("error", "callback_error");

    return NextResponse.redirect(errorUrl);
  }
}
