// Main exports for monitoring infrastructure
export * from "./interfaces/logger.interface";
export * from "./logger/otel-logger";
export * from "./exporters/trace-logs-exporter";

// Re-export the main logger instance
export { getLogger } from "./logger/otel-logger";
