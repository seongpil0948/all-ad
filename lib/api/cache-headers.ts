import { NextResponse } from "next/server";

export interface CacheConfig {
  maxAge?: number; // seconds
  staleWhileRevalidate?: number; // seconds
  mustRevalidate?: boolean;
  private?: boolean;
  noStore?: boolean;
  noCache?: boolean;
}

// Predefined cache configurations
export const CacheConfigs = {
  // Static data that rarely changes
  STATIC: {
    maxAge: 3600, // 1 hour
    staleWhileRevalidate: 7200, // 2 hours
  },

  // Analytics data - short cache due to frequent updates
  ANALYTICS: {
    maxAge: 300, // 5 minutes
    staleWhileRevalidate: 600, // 10 minutes
  },

  // Campaign data - medium cache
  CAMPAIGNS: {
    maxAge: 600, // 10 minutes
    staleWhileRevalidate: 1200, // 20 minutes
  },

  // User data - private cache only
  USER_DATA: {
    maxAge: 300, // 5 minutes
    private: true,
  },

  // Real-time data - no cache
  REAL_TIME: {
    noStore: true,
    noCache: true,
  },

  // Authentication data - no cache
  AUTH: {
    noStore: true,
    noCache: true,
    private: true,
  },
} as const;

export function setCacheHeaders(
  response: NextResponse,
  config: CacheConfig,
): NextResponse {
  const headers = new Headers(response.headers);

  if (config.noStore || config.noCache) {
    headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    headers.set("Pragma", "no-cache");
    headers.set("Expires", "0");

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  const cacheControlParts: string[] = [];

  if (config.private) {
    cacheControlParts.push("private");
  } else {
    cacheControlParts.push("public");
  }

  if (config.maxAge !== undefined) {
    cacheControlParts.push(`max-age=${config.maxAge}`);
  }

  if (config.staleWhileRevalidate !== undefined) {
    cacheControlParts.push(
      `stale-while-revalidate=${config.staleWhileRevalidate}`,
    );
  }

  if (config.mustRevalidate) {
    cacheControlParts.push("must-revalidate");
  }

  headers.set("Cache-Control", cacheControlParts.join(", "));

  // Add ETag for better cache validation
  if (response.headers.get("content-type")?.includes("application/json")) {
    const etag = generateETag(response);

    if (etag) {
      headers.set("ETag", etag);
    }
  }

  // Add Vary header for content negotiation
  headers.set("Vary", "Accept, Authorization");

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function generateETag(response: NextResponse): string | null {
  try {
    // Simple ETag generation based on content
    // In production, you might want to use a more sophisticated approach
    const content = response.body?.toString() || "";
    const hash = simpleHash(content);

    return `"${hash}"`;
  } catch {
    return null;
  }
}

function simpleHash(str: string): string {
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);

    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(36);
}

// Wrapper for API handlers with caching
export function withCaching<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>,
  cacheConfig: CacheConfig,
) {
  return async (...args: T): Promise<NextResponse> => {
    const response = await handler(...args);

    return setCacheHeaders(response, cacheConfig);
  };
}

// Helper to check if request supports caching
export function shouldCache(request: Request): boolean {
  const method = request.method;
  const url = new URL(request.url);

  // Only cache GET requests
  if (method !== "GET") {
    return false;
  }

  // Don't cache requests with query parameters that indicate real-time data
  const realTimeParams = ["live", "realtime", "now", "current"];
  const hasRealTimeParam = realTimeParams.some((param) =>
    url.searchParams.has(param),
  );

  if (hasRealTimeParam) {
    return false;
  }

  // Don't cache authenticated requests to sensitive endpoints
  const sensitiveEndpoints = ["/api/auth/", "/api/admin/", "/api/user/"];
  const isSensitive = sensitiveEndpoints.some((endpoint) =>
    url.pathname.startsWith(endpoint),
  );

  if (isSensitive) {
    return false;
  }

  return true;
}

// Helper to get cache key for request
export function getCacheKey(request: Request): string {
  const url = new URL(request.url);
  const authHeader = request.headers.get("Authorization");

  // Include user/team context in cache key for private data
  const userContext = authHeader ? simpleHash(authHeader) : "anonymous";

  return `${url.pathname}${url.search}:${userContext}`;
}
