/* eslint-disable no-console */
import { trace, SpanStatusCode } from "@opentelemetry/api";

import {
  ILogger,
  LogContext,
  LogLevel,
  LogEntry,
} from "../interfaces/logger.interface";

export class OpenTelemetryLogger implements ILogger {
  private serviceName: string;
  private isDevelopment: boolean;

  constructor(serviceName: string = "all-ad-platform") {
    this.serviceName = serviceName;
    this.isDevelopment = process.env.NODE_ENV === "development";
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    const activeSpan = trace.getActiveSpan();
    const spanContext = activeSpan?.spanContext();

    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...context,
        service: this.serviceName,
        traceId: spanContext?.traceId || context?.traceId,
        spanId: spanContext?.spanId || context?.spanId,
      },
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    };
  }

  private log(entry: LogEntry): void {
    const activeSpan = trace.getActiveSpan();

    // Add event to active span if exists
    if (activeSpan) {
      activeSpan.addEvent(entry.message, {
        "log.level": LogLevel[entry.level],
        "log.timestamp": entry.timestamp,
        ...entry.context,
      });

      // Set error status if it's an error log
      if (entry.level === LogLevel.ERROR && entry.error) {
        activeSpan.setStatus({
          code: SpanStatusCode.ERROR,
          message: entry.error.message,
        });
        activeSpan.recordException(new Error(entry.error.message));
      }
    }

    // Console output for development
    if (this.isDevelopment) {
      this.consoleOutput(entry);
    }

    // Send to external logging service (Vercel, Datadog, etc.)
    this.sendToExternalService(entry);
  }

  private consoleOutput(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const level = LogLevel[entry.level];
    const prefix = `[${timestamp}] [${level}]`;
    const contextStr = entry.context
      ? JSON.stringify(entry.context, null, 2)
      : "";

    switch (entry.level) {
      case LogLevel.TRACE:
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, contextStr);
        break;
      case LogLevel.INFO:
        console.info(prefix, entry.message, contextStr);
        break;
      case LogLevel.WARN:
        console.warn(prefix, entry.message, contextStr);
        break;
      case LogLevel.ERROR:
        console.error(
          prefix,
          entry.message,
          entry.error?.stack || "",
          contextStr
        );
        break;
    }
  }

  private async sendToExternalService(entry: LogEntry): Promise<void> {
    // Implementation for sending logs to external service
    // This could be Vercel logs, Datadog, CloudWatch, etc.
    try {
      if (process.env.VERCEL) {
        // Vercel automatically captures console logs
        return;
      }

      // Custom implementation for other services
      if (process.env.LOG_ENDPOINT) {
        await fetch(process.env.LOG_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entry),
        }).catch(() => {
          // Fail silently to not affect application performance
        });
      }
    } catch (_error) {
      console.error("Failed to send log to external service", _error, entry);
    }
  }

  trace(message: string, context?: LogContext): void {
    this.log(this.createLogEntry(LogLevel.TRACE, message, context));
  }

  debug(message: string, context?: LogContext): void {
    this.log(this.createLogEntry(LogLevel.DEBUG, message, context));
  }

  info(message: string, context?: LogContext): void {
    this.log(this.createLogEntry(LogLevel.INFO, message, context));
  }

  warn(message: string, context?: LogContext): void {
    this.log(this.createLogEntry(LogLevel.WARN, message, context));
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log(this.createLogEntry(LogLevel.ERROR, message, context, error));
  }
}

// Singleton instance
let loggerInstance: ILogger | null = null;

export function getLogger(): ILogger {
  if (!loggerInstance) {
    loggerInstance = new OpenTelemetryLogger();
  }

  return loggerInstance;
}
