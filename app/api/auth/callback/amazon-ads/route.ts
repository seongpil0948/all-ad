import { NextRequest, NextResponse } from "next/server";

import log from "@/utils/logger";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    // OAuth 에러 처리
    if (error) {
      log.error("Amazon Ads OAuth error", { error, errorDescription });

      return NextResponse.redirect(
        new URL(`/lab?error=${encodeURIComponent(error)}`, request.url),
      );
    }

    // 인증 코드 확인
    if (!code) {
      log.error("Amazon Ads OAuth callback missing authorization code");

      return NextResponse.redirect(
        new URL("/lab?error=missing_code", request.url),
      );
    }

    // state 검증 (CSRF 방지)
    if (state) {
      // TODO: 실제 구현시 state 검증 로직 추가
      log.info("Amazon Ads OAuth state received", { state });
    }

    // Lab 페이지로 리다이렉트하면서 authorization code 전달
    const redirectUrl = new URL("/lab", request.url);

    redirectUrl.searchParams.set("code", code);
    redirectUrl.searchParams.set("platform", "amazon-ads");

    log.info("Amazon Ads OAuth callback successful", {
      code: code.substring(0, 10) + "...", // 보안을 위해 일부만 로깅
      state,
    });

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    log.error("Amazon Ads OAuth callback error", { error });

    return NextResponse.redirect(
      new URL("/lab?error=callback_error", request.url),
    );
  }
}
