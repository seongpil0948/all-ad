import { NextResponse } from "next/server";

import log from "@/utils/logger";

/**
 * Standard API error response format
 */
export interface ApiError {
  error: string;
  message?: string;
  code?: string;
  details?: unknown;
}

/**
 * Custom error class for API errors
 */
export class ApiException extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiException";
  }
}

/**
 * Standard error responses
 */
export const ApiErrors = {
  // Authentication errors
  UNAUTHORIZED: () =>
    new ApiException(401, "UNAUTHORIZED", "Authentication required"),
  INVALID_TOKEN: () =>
    new ApiException(401, "INVALID_TOKEN", "Invalid or expired token"),

  // Authorization errors
  FORBIDDEN: () =>
    new ApiException(403, "FORBIDDEN", "Insufficient permissions"),
  VIEWER_READONLY: () =>
    new ApiException(
      403,
      "VIEWER_READONLY",
      "Viewers cannot perform write operations",
    ),

  // Resource errors
  NOT_FOUND: (resource: string) =>
    new ApiException(404, "NOT_FOUND", `${resource} not found`),
  TEAM_NOT_FOUND: () =>
    new ApiException(404, "TEAM_NOT_FOUND", "Team not found"),

  // Validation errors
  INVALID_REQUEST: (message: string) =>
    new ApiException(400, "INVALID_REQUEST", message),
  MISSING_PARAMETER: (param: string) =>
    new ApiException(
      400,
      "MISSING_PARAMETER",
      `Missing required parameter: ${param}`,
    ),

  // Platform errors
  PLATFORM_ERROR: (platform: string, message: string) =>
    new ApiException(
      502,
      "PLATFORM_ERROR",
      `${platform} API error: ${message}`,
    ),
  SYNC_FAILED: (platform: string) =>
    new ApiException(500, "SYNC_FAILED", `Failed to sync ${platform} data`),

  // Rate limiting
  RATE_LIMITED: () =>
    new ApiException(429, "RATE_LIMITED", "Too many requests"),

  // Server errors
  INTERNAL_ERROR: () =>
    new ApiException(500, "INTERNAL_ERROR", "Internal server error"),
} as const;

/**
 * Create error response from ApiException
 */
export function createErrorResponse(error: ApiException): NextResponse {
  const response: ApiError = {
    error: error.code,
    message: error.message,
  };

  if (error.details) {
    response.details = error.details;
  }

  return NextResponse.json(response, { status: error.statusCode });
}

/**
 * Global error handler for API routes
 */
export function handleApiError(error: unknown, context?: string): NextResponse {
  // Handle ApiException
  if (error instanceof ApiException) {
    log.warn(`API error ${context ? `in ${context}` : ""}`, {
      code: error.code,
      message: error.message,
      details:
        typeof error.details === "object" && error.details !== null
          ? (error.details as Record<string, unknown>)
          : String(error.details),
    });

    return createErrorResponse(error);
  }

  // Handle other errors
  log.error(`Unexpected error ${context ? `in ${context}` : ""}`, error);

  return createErrorResponse(ApiErrors.INTERNAL_ERROR());
}

/**
 * Validate required parameters
 */
export function validateParams<T extends Record<string, unknown>>(
  params: unknown,
  required: (keyof T)[],
): asserts params is T {
  if (!params || typeof params !== "object") {
    throw ApiErrors.INVALID_REQUEST("Invalid parameters");
  }

  const paramObj = params as Record<string, unknown>;

  for (const key of required) {
    if (
      paramObj[key as string] === undefined ||
      paramObj[key as string] === null
    ) {
      throw ApiErrors.MISSING_PARAMETER(String(key));
    }
  }
}

/**
 * Type guard for checking if error has message
 */
export function hasErrorMessage(error: unknown): error is { message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as Record<string, unknown>).message === "string"
  );
}
