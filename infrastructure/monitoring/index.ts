// Main exports for monitoring infrastructure
export * from "./interfaces/logger.interface";
export * from "./logger/otel-logger";

// Re-export the main logger instance
export { getLogger } from "./logger/otel-logger";
