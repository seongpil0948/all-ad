// Logger interface following hexagonal architecture principles
export interface ILogger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: Error, context?: LogContext): void;
  trace(message: string, context?: LogContext): void;
}

export interface LogContext {
  [key: string]: any;
  userId?: string;
  sessionId?: string;
  traceId?: string;
  spanId?: string;
  service?: string;
  module?: string;
  method?: string;
  duration?: number;
  statusCode?: number;
  url?: string;
  userAgent?: string;
  ip?: string;
}

export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}
