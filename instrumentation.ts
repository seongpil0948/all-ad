import { registerOTel } from "@vercel/otel";

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
  });
}
