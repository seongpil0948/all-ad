import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { Resource } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

// Custom trace exporter configuration
export const traceLogsExporter = new OTLPTraceExporter({
  url:
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
    "http://localhost:4318/v1/traces",
  headers: {
    "x-api-key": process.env.OTEL_API_KEY || "",
  },
});

// Configure trace provider with custom settings
export function configureTraceProvider(): NodeTracerProvider {
  const provider = new NodeTracerProvider({
    resource: new Resource({
      [ATTR_SERVICE_NAME]: "all-ad-platform",
      "service.version": process.env.SERVICE_VERSION || "1.0.0",
      "deployment.environment": process.env.NODE_ENV || "development",
    }),
  });

  // Add batch processor for better performance
  provider.addSpanProcessor(
    new BatchSpanProcessor(traceLogsExporter, {
      maxQueueSize: 2048,
      maxExportBatchSize: 512,
      scheduledDelayMillis: 5000,
      exportTimeoutMillis: 30000,
    })
  );

  return provider;
}
