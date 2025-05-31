import { registerOTel } from "@vercel/otel";

import { traceLogsExporter } from "./infrastructure/monitoring/exporters/trace-logs-exporter";

export function register() {
  registerOTel({
    serviceName: "all-ad-platform",
    instrumentationConfig: {
      fetch: {
        ignoreUrls: [
          // Ignore health check endpoints
          /health/,
          // Ignore static assets
          /_next\/static/,
          /_next\/image/,
          /favicon.ico/,
        ],
      },
    },
    // Custom exporter for logs
    traceExporter: traceLogsExporter,
  });
}
