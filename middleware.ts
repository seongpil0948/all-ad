import { type NextRequest, NextResponse } from "next/server";

import { updateSession } from "@/utils/supabase/middleware";
import log from "@/utils/logger";

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const { pathname } = request.nextUrl;
  const method = request.method;

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
     * - api/health (health check endpoint)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|api/health|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
