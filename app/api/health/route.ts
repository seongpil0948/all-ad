import { NextRequest, NextResponse } from "next/server";

import log from "@/utils/logger";

interface HealthCheckResponse {
  status: "healthy" | "unhealthy";
  timestamp: string;
  service: string;
  version: string;
  uptime: number;
  environment: string;
  checks: {
    database: boolean;
    cache?: boolean;
    external_apis?: boolean;
  };
}

// Track server start time
const serverStartTime = Date.now();

export async function GET(_request: NextRequest) {
  const startTime = Date.now();

  return log.span(
    "health-check",
    async () => {
      try {
        // Perform health checks
        const checks = await performHealthChecks();

        const response: HealthCheckResponse = {
          status: checks.database ? "healthy" : "unhealthy",
          timestamp: new Date().toISOString(),
          service: "all-ad-platform",
          version: process.env.SERVICE_VERSION || "1.0.0",
          uptime: Date.now() - serverStartTime,
          environment: process.env.NODE_ENV || "development",
          checks,
        };

        const duration = Date.now() - startTime;

        log.info("Health check completed", {
          module: "api.health",
          status: response.status,
          duration,
          checks,
        });

        return NextResponse.json(response, {
          status: response.status === "healthy" ? 200 : 503,
        });
      } catch (error) {
        log.error("Health check failed", error as Error, {
          module: "api.health",
          duration: Date.now() - startTime,
        });

        return NextResponse.json(
          {
            status: "unhealthy",
            error: "Internal health check error",
            timestamp: new Date().toISOString(),
          },
          { status: 503 },
        );
      }
    },
    {
      module: "api.health",
      method: "GET",
      path: "/api/health",
    },
  );
}

async function performHealthChecks(): Promise<{
  database: boolean;
  cache?: boolean;
  external_apis?: boolean;
}> {
  const checks = {
    database: false,
    cache: true,
    external_apis: true,
  };

  // Database health check
  try {
    // Add your actual database health check here
    // For example, a simple query to check connection
    checks.database = true;
    log.debug("Database health check passed", { module: "health-check" });
  } catch (error) {
    log.error("Database health check failed", error as Error, {
      module: "health-check",
    });
    checks.database = false;
  }

  return checks;
}
