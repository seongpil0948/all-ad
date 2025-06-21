// Simple logger implementation
export interface LogContext {
  [key: string]: any;
}

// Logger implementation
class Logger {
  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  trace(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(this.formatMessage('TRACE', message, context));
    }
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(this.formatMessage('DEBUG', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    console.log(this.formatMessage('INFO', message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('WARN', message, context));
  }

  error(message: string, error?: Error | string | unknown, context?: LogContext): void {
    let errorMessage = message;
    
    if (error instanceof Error) {
      errorMessage = `${message}: ${error.message}`;
      console.error(this.formatMessage('ERROR', errorMessage, context));
      if (error.stack && process.env.NODE_ENV === 'development') {
        console.error(error.stack);
      }
    } else if (typeof error === 'string') {
      errorMessage = `${message}: ${error}`;
      console.error(this.formatMessage('ERROR', errorMessage, context));
    } else if (error !== undefined) {
      const serializedError = JSON.stringify(error, null, 2);
      errorMessage = `${message}: ${serializedError}`;
      console.error(this.formatMessage('ERROR', errorMessage, context));
    } else {
      console.error(this.formatMessage('ERROR', errorMessage, context));
    }
  }

  // HTTP request logging helper
  http(
    method: string,
    url: string,
    statusCode?: number,
    duration?: number,
    context?: LogContext,
  ): void {
    const level = statusCode && statusCode >= 400 ? 'ERROR' : 'INFO';
    const message = `${method} ${url} - ${statusCode || 'pending'}`;
    
    const httpContext: LogContext = {
      ...context,
      method,
      url,
      statusCode,
      duration,
    };

    if (level === 'ERROR') {
      this.error(message, undefined, httpContext);
    } else {
      this.info(message, httpContext);
    }
  }

  // Database query logging helper
  db(
    operation: string,
    table: string,
    duration?: number,
    context?: LogContext,
  ): void {
    const message = `DB ${operation} on ${table}`;
    
    this.debug(message, {
      ...context,
      operation,
      table,
      duration,
    });
  }

  // Performance logging helper
  perf(operation: string, duration: number, context?: LogContext): void {
    const message = `Performance: ${operation} took ${duration}ms`;
    const level = duration > 1000 ? 'WARN' : 'DEBUG';
    
    if (level === 'WARN') {
      this.warn(message, { ...context, operation, duration });
    } else {
      this.debug(message, { ...context, operation, duration });
    }
  }

  // Log with automatic span creation (simplified version)
  async span<T>(
    name: string,
    operation: () => T | Promise<T>,
    context?: LogContext,
  ): Promise<T> {
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
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.error(`Failed ${name}`, error as Error, {
        ...context,
        spanName: name,
        duration,
      });
      
      throw error;
    }
  }
}

// Create logger instance
const logger = new Logger();

// Export convenience functions
export const log = {
  trace: logger.trace.bind(logger),
  debug: logger.debug.bind(logger),
  info: logger.info.bind(logger),
  warn: logger.warn.bind(logger),
  error: logger.error.bind(logger),
  span: logger.span.bind(logger),
  http: logger.http.bind(logger),
  db: logger.db.bind(logger),
  perf: logger.perf.bind(logger),
};

// Default export
export default log;