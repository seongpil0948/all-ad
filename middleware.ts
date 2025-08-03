import { type NextRequest, NextResponse } from "next/server";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";

import { updateSession } from "@/utils/supabase/middleware";
import log from "@/utils/logger";

const locales = ["en", "ko", "zh"];
const defaultLocale = "en";

// Paths or patterns that should skip locale redirect
const LOCALE_SKIP_PATTERNS = {
  // Exact paths
  exactPaths: [
    "/robots.txt",
    "/sitemap.xml",
    "/manifest.json",
    "/manifest.webmanifest",
    "/favicon.ico",
    "/icon",
    "/apple-icon",
    "/opengraph-image",
    "/twitter-image",
  ],
  // Path prefixes
  prefixes: ["/api/", "/_next/", "/static/"],
  // File extensions
  extensions: [
    ".txt",
    ".xml",
    ".ico",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".svg",
  ],
  // String patterns to check if path includes
  includes: [
    "tiktok",
    "facebook-domain-verification",
    "google-site-verification",
  ],
};

function shouldSkipLocaleRedirect(pathname: string): boolean {
  // Check exact paths
  if (LOCALE_SKIP_PATTERNS.exactPaths.includes(pathname)) {
    return true;
  }

  // Check prefixes
  if (
    LOCALE_SKIP_PATTERNS.prefixes.some((prefix) => pathname.startsWith(prefix))
  ) {
    return true;
  }

  // Check file extensions
  if (LOCALE_SKIP_PATTERNS.extensions.some((ext) => pathname.endsWith(ext))) {
    return true;
  }

  // Check if path includes specific patterns
  if (
    LOCALE_SKIP_PATTERNS.includes.some((pattern) => pathname.includes(pattern))
  ) {
    return true;
  }

  return false;
}

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

  // Check if this path should skip locale redirect
  const skipLocale = shouldSkipLocaleRedirect(pathname);

  // Check if there is any supported locale in the pathname
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  // Redirect if there is no locale (unless it's a path we want to skip)
  if (!pathnameHasLocale && !skipLocale) {
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
