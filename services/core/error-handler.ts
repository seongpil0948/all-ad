import log from "@/utils/logger";

/**
 * Custom error class for service layer errors
 */
export class ServiceError extends Error {
  constructor(
    public service: string,
    public operation: string,
    public originalError?: Error | unknown,
    public context?: Record<string, any>,
  ) {
    const errorMessage =
      originalError instanceof Error
        ? originalError.message
        : String(originalError);

    super(`[${service}] ${operation} failed: ${errorMessage}`);
    this.name = "ServiceError";
  }
}

/**
 * Decorator for automatic error handling and logging
 */
export function withErrorHandling(service: string, operation: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();

      try {
        log.info(`[${service}] Starting ${operation}`, { args: args.length });
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;

        log.info(`[${service}] Completed ${operation}`, { duration });

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;

        log.error(`[${service}] Failed ${operation}`, error as Error, {
          duration,
        });
        throw new ServiceError(service, operation, error);
      }
    };

    return descriptor;
  };
}

/**
 * Retry decorator with exponential backoff
 */
export function withRetry(maxAttempts = 3, backoffMs = 1000) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      let lastError: Error | unknown;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          lastError = error;

          if (attempt < maxAttempts) {
            const delay = backoffMs * Math.pow(2, attempt - 1);

            log.warn(
              `Retry attempt ${attempt}/${maxAttempts} after ${delay}ms`,
              {
                method: propertyKey,
                error: error instanceof Error ? error.message : String(error),
              },
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }

      throw lastError;
    };

    return descriptor;
  };
}
