// Common error parser for platform services
import { PlatformError } from "@/types/platform-errors.types";
import { PlatformType } from "@/types";
import { PlatformApiErrorCode } from "@/types/platform-common.types";

interface ErrorMapping {
  codes: number[];
  platformCode: string;
  retryable: boolean;
  userMessage: string;
}

// Common error mappings across platforms
const COMMON_ERROR_MAPPINGS: Record<string, ErrorMapping> = {
  AUTH: {
    codes: [401, 403],
    platformCode: PlatformApiErrorCode.INVALID_TOKEN,
    retryable: true,
    userMessage: "Authentication failed. Please reconnect your account.",
  },
  RATE_LIMIT: {
    codes: [429],
    platformCode: PlatformApiErrorCode.RATE_LIMIT,
    retryable: true,
    userMessage: "Rate limit exceeded. Please try again later.",
  },
  NOT_FOUND: {
    codes: [404],
    platformCode: PlatformApiErrorCode.NOT_FOUND,
    retryable: false,
    userMessage: "The requested resource was not found.",
  },
  SERVER_ERROR: {
    codes: [500, 502, 503, 504],
    platformCode: PlatformApiErrorCode.INTERNAL_ERROR,
    retryable: true,
    userMessage: "Temporary server issue. Please try again later.",
  },
  BAD_REQUEST: {
    codes: [400],
    platformCode: PlatformApiErrorCode.INVALID_REQUEST,
    retryable: false,
    userMessage: "Invalid request. Please check your parameters.",
  },
};

// Platform-specific error code mappings
const PLATFORM_ERROR_MAPPINGS: Record<
  PlatformType,
  Record<string, ErrorMapping>
> = {
  google: {
    AUTH: {
      codes: [401, 403],
      platformCode: "AUTH_ERROR",
      retryable: true,
      userMessage:
        "Google Ads authentication failed. Please reconnect your account.",
    },
    QUOTA: {
      codes: [429],
      platformCode: "QUOTA_EXCEEDED",
      retryable: true,
      userMessage: "Google Ads API quota exceeded. Please try again later.",
    },
  },
  facebook: {
    AUTH: {
      codes: [190, 102],
      platformCode: "AUTH_ERROR",
      retryable: true,
      userMessage:
        "Facebook authentication failed. Please reconnect your account.",
    },
    RATE_LIMIT: {
      codes: [17, 32, 613],
      platformCode: "RATE_LIMIT",
      retryable: true,
      userMessage: "Facebook API rate limit reached. Please try again later.",
    },
  },
  amazon: {
    AUTH: {
      codes: [401, 403],
      platformCode: "AUTH_ERROR",
      retryable: true,
      userMessage:
        "Amazon Ads authentication failed. Please reconnect your account.",
    },
    THROTTLE: {
      codes: [429],
      platformCode: "THROTTLED",
      retryable: true,
      userMessage: "Amazon API request throttled. Please try again later.",
    },
  },
  tiktok: {
    AUTH: {
      codes: [40100, 40101, 40102],
      platformCode: "AUTH_ERROR",
      retryable: true,
      userMessage:
        "TikTok authentication failed. Please reconnect your account.",
    },
    RATE_LIMIT: {
      codes: [40001],
      platformCode: "RATE_LIMIT",
      retryable: true,
      userMessage: "TikTok API rate limit reached. Please try again later.",
    },
    SERVER_ERROR: {
      codes: [50001, 50002],
      platformCode: "API_ERROR",
      retryable: true,
      userMessage: "TikTok server error. Please try again later.",
    },
  },
  kakao: {
    AUTH: {
      codes: [401, 403],
      platformCode: "AUTH_ERROR",
      retryable: true,
      userMessage:
        "Kakao authentication failed. Please reconnect your account.",
    },
    RATE_LIMIT: {
      codes: [429],
      platformCode: "RATE_LIMIT",
      retryable: true,
      userMessage: "Kakao API rate limit reached. Please try again later.",
    },
  },
  naver: {
    AUTH: {
      codes: [401, 403],
      platformCode: "AUTH_ERROR",
      retryable: true,
      userMessage:
        "Naver authentication failed. Please reconnect your account.",
    },
    RATE_LIMIT: {
      codes: [429],
      platformCode: "RATE_LIMIT",
      retryable: true,
      userMessage: "Naver API rate limit reached. Please try again later.",
    },
  },
  coupang: {
    AUTH: {
      codes: [401],
      platformCode: "AUTH_ERROR",
      retryable: false,
      userMessage:
        "Coupang authentication failed. Please check your credentials.",
    },
  },
};

/**
 * Parse platform-specific error into PlatformError
 */
export function parsePlatformError(
  error: unknown,
  platform: PlatformType,
): PlatformError {
  // Extract error information
  const errorObj = error as
    | {
        code?: number | string;
        message?: string;
        statusCode?: number;
        response?: {
          status?: number;
          data?: {
            error?: {
              code?: number;
              message?: string;
            };
          };
        };
      }
    | undefined;

  // Try to extract error code from various sources
  const errorCode =
    errorObj?.code ||
    errorObj?.statusCode ||
    errorObj?.response?.status ||
    errorObj?.response?.data?.error?.code;

  const errorMessage =
    errorObj?.message ||
    errorObj?.response?.data?.error?.message ||
    "An unknown error occurred";

  // Check platform-specific mappings first
  const platformMappings = PLATFORM_ERROR_MAPPINGS[platform];

  if (platformMappings && typeof errorCode === "number") {
    for (const mapping of Object.values(platformMappings)) {
      if (mapping.codes.includes(errorCode)) {
        return new PlatformError(
          errorMessage,
          platform,
          mapping.platformCode,
          mapping.retryable,
          mapping.userMessage,
        );
      }
    }
  }

  // Check common mappings
  if (typeof errorCode === "number") {
    for (const mapping of Object.values(COMMON_ERROR_MAPPINGS)) {
      if (mapping.codes.includes(errorCode)) {
        return new PlatformError(
          errorMessage,
          platform,
          mapping.platformCode,
          mapping.retryable,
          mapping.userMessage,
        );
      }
    }
  }

  // Check for network errors
  if (
    errorMessage.toLowerCase().includes("network") ||
    errorMessage.toLowerCase().includes("fetch") ||
    errorMessage.toLowerCase().includes("timeout")
  ) {
    return new PlatformError(
      errorMessage,
      platform,
      PlatformApiErrorCode.NETWORK_ERROR,
      true,
      "Network connection issue. Please check your internet connection.",
    );
  }

  // Default error
  return new PlatformError(
    errorMessage,
    platform,
    "UNKNOWN_ERROR",
    false,
    `An error occurred with ${platform}. Please try again or contact support.`,
  );
}

/**
 * Check if error is retryable based on error code
 */
export function isRetryableError(error: unknown): boolean {
  const platformError = error instanceof PlatformError ? error : null;

  if (platformError) {
    return platformError.retryable;
  }

  // Check if it's a network error
  const message = (error as Error)?.message?.toLowerCase() || "";

  return (
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("fetch")
  );
}

/**
 * Extract error code from various error formats
 */
export function extractErrorCode(error: unknown): number | string | undefined {
  const errorObj = error as {
    code?: number | string;
    statusCode?: number;
    response?: {
      status?: number;
      data?: {
        error?: {
          code?: number;
        };
      };
    };
    error_code?: number | string;
  };

  return (
    errorObj?.code ||
    errorObj?.statusCode ||
    errorObj?.response?.status ||
    errorObj?.response?.data?.error?.code ||
    errorObj?.error_code
  );
}

/**
 * Create a user-friendly error message
 */
export function createUserErrorMessage(
  error: unknown,
  platform: PlatformType,
  operation: string,
): string {
  if (error instanceof PlatformError) {
    return error.userMessage;
  }

  const errorCode = extractErrorCode(error);

  if (errorCode) {
    return `${platform} error (${errorCode}) during ${operation}. Please try again.`;
  }

  return `An error occurred with ${platform} during ${operation}. Please try again.`;
}
