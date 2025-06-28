import { type NextRequest, NextResponse } from "next/server";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";

import { updateSession } from "@/utils/supabase/middleware";
import log from "@/utils/logger";

const locales = ["en", "ko", "zh"];
const defaultLocale = "en";

function getLocale(request: NextRequest): string {
  try {
    const negotiatorHeaders: Record<string, string> = {};

    request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));

    const languages = new Negotiator({
      headers: negotiatorHeaders,
    }).languages();

    // Filter out invalid languages and ensure we have a valid array
    const validLanguages = languages.filter(
      (lang): lang is string => typeof lang === "string" && lang.length > 0,
    );

    // If no valid languages, return default
    if (validLanguages.length === 0) {
      return defaultLocale;
    }

    return match(validLanguages, locales, defaultLocale);
  } catch (error) {
    log.warn("Failed to get locale from headers, using default", {
      error: error instanceof Error ? error.message : String(error),
    });

    return defaultLocale;
  }
}

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Check if there is any supported locale in the pathname
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  // Redirect if there is no locale
  if (!pathnameHasLocale) {
    const locale = getLocale(request);

    request.nextUrl.pathname = `/${locale}${pathname}`;

    return NextResponse.redirect(request.nextUrl);
  }

  // Log incoming request
  log.http(method, pathname, undefined, undefined, {
    userAgent: request.headers.get("user-agent") || undefined,
    ip:
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      undefined,
    referer: request.headers.get("referer") || undefined,
  });

  try {
    // Process the request with session update
    const response = await log.span(
      "middleware.updateSession",
      async () => await updateSession(request),
      {
        module: "middleware",
        pathname,
        method,
      },
    );

    const duration = Date.now() - startTime;
    const status = response.status;

    // Log response
    log.http(method, pathname, status, duration, {
      module: "middleware",
      responseHeaders: Object.fromEntries(response.headers.entries()),
    });

    // Add custom headers for tracing
    const modifiedResponse = NextResponse.next(response);

    modifiedResponse.headers.set("x-response-time", `${duration}ms`);

    return modifiedResponse;
  } catch (error) {
    const duration = Date.now() - startTime;

    log.error("Middleware error", error as Error, {
      module: "middleware",
      pathname,
      method,
      duration,
    });

    // Return error response
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/ (all API routes)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
