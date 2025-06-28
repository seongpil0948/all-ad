import { NextResponse } from "next/server";

import log from "@/utils/logger";

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  details?: unknown;
}

export class StandardApiError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(
    message: string,
    code: string = "INTERNAL_ERROR",
    statusCode: number = 500,
    details?: unknown,
  ) {
    super(message);
    this.name = "StandardApiError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

// Predefined error types
export const ApiErrors = {
  UNAUTHORIZED: (message = "Unauthorized") =>
    new StandardApiError(message, "UNAUTHORIZED", 401),
  FORBIDDEN: (message = "Forbidden") =>
    new StandardApiError(message, "FORBIDDEN", 403),
  NOT_FOUND: (message = "Not found") =>
    new StandardApiError(message, "NOT_FOUND", 404),
  BAD_REQUEST: (message = "Bad request") =>
    new StandardApiError(message, "BAD_REQUEST", 400),
  VALIDATION_ERROR: (message = "Validation failed", details?: unknown) =>
    new StandardApiError(message, "VALIDATION_ERROR", 422, details),
  RATE_LIMITED: (message = "Rate limit exceeded") =>
    new StandardApiError(message, "RATE_LIMITED", 429),
  DATABASE_ERROR: (message = "Database operation failed") =>
    new StandardApiError(message, "DATABASE_ERROR", 500),
  EXTERNAL_API_ERROR: (message = "External API error") =>
    new StandardApiError(message, "EXTERNAL_API_ERROR", 502),
  SYNC_ERROR: (message = "Sync operation failed") =>
    new StandardApiError(message, "SYNC_ERROR", 500),
  TOKEN_REFRESH_ERROR: (message = "Token refresh failed") =>
    new StandardApiError(message, "TOKEN_REFRESH_ERROR", 401),
};

// Sanitize error messages for client
function sanitizeErrorMessage(error: unknown, isDevelopment: boolean): string {
  if (error instanceof StandardApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    // In development, show full error message
    if (isDevelopment) {
      return error.message;
    }

    // In production, sanitize error messages
    if (error.message.includes("auth") || error.message.includes("token")) {
      return "Authentication failed";
    }

    if (error.message.includes("database") || error.message.includes("sql")) {
      return "Database operation failed";
    }

    if (error.message.includes("network") || error.message.includes("fetch")) {
      return "Network operation failed";
    }
  }

  return "An unexpected error occurred";
}

// Standard error handler for API routes
export function handleApiError(error: unknown, context?: string): NextResponse {
  const isDevelopment = process.env.NODE_ENV === "development";

  // Log the error with context
  log.error(`API Error${context ? ` in ${context}` : ""}`, {
    error:
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
            code: error instanceof StandardApiError ? error.code : undefined,
          }
        : error,
    context,
    timestamp: new Date().toISOString(),
  });

  // Handle StandardApiError
  if (error instanceof StandardApiError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(isDevelopment && error.details ? { details: error.details } : {}),
        },
      },
      { status: error.statusCode },
    );
  }

  // Handle known error patterns
  if (error && typeof error === "object" && "code" in error) {
    const dbError = error as { code: string; message: string };

    // PostgreSQL error codes
    switch (dbError.code) {
      case "23505": // unique_violation
        return NextResponse.json(
          {
            error: {
              code: "DUPLICATE_ENTRY",
              message: "Resource already exists",
            },
          },
          { status: 409 },
        );
      case "23503": // foreign_key_violation
        return NextResponse.json(
          {
            error: {
              code: "INVALID_REFERENCE",
              message: "Referenced resource not found",
            },
          },
          { status: 400 },
        );
      case "42703": // undefined_column
        return NextResponse.json(
          {
            error: {
              code: "DATABASE_SCHEMA_ERROR",
              message: "Database schema mismatch",
            },
          },
          { status: 500 },
        );
    }
  }

  // Default error response
  const sanitizedMessage = sanitizeErrorMessage(error, isDevelopment);

  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: sanitizedMessage,
        ...(isDevelopment && {
          original: error instanceof Error ? error.message : String(error),
        }),
      },
    },
    { status: 500 },
  );
}

// Wrapper for async API route handlers
export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>,
  context?: string,
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error, context);
    }
  };
}

// Helper for validating request data
export function validateRequired<T extends Record<string, unknown>>(
  data: Record<string, unknown>,
  requiredFields: (keyof T)[],
): T {
  const missing = requiredFields.filter((field) => {
    const fieldValue = data[field as string];

    return fieldValue === undefined || fieldValue === null || fieldValue === "";
  });

  if (missing.length > 0) {
    throw ApiErrors.VALIDATION_ERROR(
      `Missing required fields: ${missing.join(", ")}`,
      { missingFields: missing },
    );
  }

  return data as T;
}

// Helper for pagination validation
export function validatePagination(params: URLSearchParams) {
  const page = parseInt(params.get("page") || "1");
  const limit = parseInt(params.get("limit") || "20");

  if (page < 1) {
    throw ApiErrors.BAD_REQUEST("Page must be greater than 0");
  }

  if (limit < 1 || limit > 100) {
    throw ApiErrors.BAD_REQUEST("Limit must be between 1 and 100");
  }

  return { page, limit, offset: (page - 1) * limit };
}
