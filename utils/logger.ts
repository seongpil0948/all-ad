import { trace } from "@opentelemetry/api";

import { getLogger } from "../infrastructure/monitoring/logger/otel-logger";
import { LogContext } from "../infrastructure/monitoring/interfaces/logger.interface";

const logger = getLogger();

// Utility class for easy logging with automatic span creation
export class Logger {
  private static getContext(additionalContext?: LogContext): LogContext {
    return {
      timestamp: new Date().toISOString(),
      ...additionalContext,
    };
  }

  // Trace level - most detailed logging
  static trace(message: string, context?: LogContext): void {
    logger.trace(message, this.getContext(context));
  }

  // Debug level - debugging information
  static debug(message: string, context?: LogContext): void {
    logger.debug(message, this.getContext(context));
  }

  // Info level - general information
  static info(message: string, context?: LogContext): void {
    logger.info(message, this.getContext(context));
  }

  // Warn level - warning messages
  static warn(message: string, context?: LogContext): void {
    logger.warn(message, this.getContext(context));
  }

  // Error level - error messages
  static error(
    message: string,
    error?: Error | string | unknown,
    context?: LogContext,
  ): void {
    if (error instanceof Error) {
      logger.error(message, error, this.getContext(context));
    } else if (typeof error === "string") {
      logger.error(message, new Error(error), this.getContext(context));
    } else if (error !== undefined) {
      const serializedError = JSON.stringify(error, null, 2);
      logger.error(
        `${message}: ${serializedError}`,
        undefined,
        this.getContext(context),
      );
    } else {
      logger.error(message, undefined, this.getContext(context));
    }
  }

  // Log with automatic span creation
  static span<T>(
    name: string,
    operation: () => T | Promise<T>,
    context?: LogContext,
  ): T | Promise<T> {
    const tracer = trace.getTracer("all-ad-platform");

    return tracer.startActiveSpan(name, async (span) => {
      const startTime = Date.now();

      try {
        this.info(`Starting ${name}`, { ...context, spanName: name });
        const result = await operation();

        const duration = Date.now() - startTime;

        this.info(`Completed ${name}`, {
          ...context,
          spanName: name,
          duration,
        });

        span.end();

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;

        this.error(`Failed ${name}`, error as Error, {
          ...context,
          spanName: name,
          duration,
        });

        span.recordException(error as Error);
        span.end();
        throw error;
      }
    });
  }

  // HTTP request logging helper
  static http(
    method: string,
    url: string,
    statusCode?: number,
    duration?: number,
    context?: LogContext,
  ): void {
    const level = statusCode && statusCode >= 400 ? "error" : "info";
    const message = `${method} ${url} - ${statusCode || "pending"}`;

    const httpContext: LogContext = {
      ...context,
      method,
      url,
      statusCode,
      duration,
    };

    if (level === "error") {
      logger.error(message, undefined, this.getContext(httpContext));
    } else {
      logger.info(message, this.getContext(httpContext));
    }
  }

  // Database query logging helper
  static db(
    operation: string,
    table: string,
    duration?: number,
    context?: LogContext,
  ): void {
    const message = `DB ${operation} on ${table}`;

    logger.debug(
      message,
      this.getContext({
        ...context,
        operation,
        table,
        duration,
      }),
    );
  }

  // Performance logging helper
  static perf(operation: string, duration: number, context?: LogContext): void {
    const message = `Performance: ${operation} took ${duration}ms`;
    const level = duration > 1000 ? "warn" : "debug";

    if (level === "warn") {
      logger.warn(
        message,
        this.getContext({ ...context, operation, duration }),
      );
    } else {
      logger.debug(
        message,
        this.getContext({ ...context, operation, duration }),
      );
    }
  }
}

// Export convenience functions to replace console.log
export const log = {
  trace: Logger.trace.bind(Logger),
  debug: Logger.debug.bind(Logger),
  info: Logger.info.bind(Logger),
  warn: Logger.warn.bind(Logger),
  error: Logger.error.bind(Logger),
  span: Logger.span.bind(Logger),
  http: Logger.http.bind(Logger),
  db: Logger.db.bind(Logger),
  perf: Logger.perf.bind(Logger),
};

// Default export for easy import
export default log;
