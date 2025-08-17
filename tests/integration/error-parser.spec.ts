import { test, expect } from "@playwright/test";
import {
  parsePlatformError,
  isRetryableError,
  extractErrorCode,
  createUserErrorMessage,
} from "@/services/platforms/common/error-parser";
import { PlatformError } from "@/types/platform-errors.types";
import type { PlatformType } from "@/types";

test.describe("Error Parser Unit Tests", () => {
  test("should parse common HTTP error codes correctly", () => {
    const testCases = [
      {
        code: 401,
        expectedRetryable: true,
        expectedMessage:
          "Authentication failed. Please reconnect your account.",
      },
      {
        code: 429,
        expectedRetryable: true,
        expectedMessage: "Rate limit exceeded. Please try again later.",
      },
      {
        code: 404,
        expectedRetryable: false,
        expectedMessage: "The requested resource was not found.",
      },
      {
        code: 500,
        expectedRetryable: true,
        expectedMessage: "Temporary server issue. Please try again later.",
      },
      {
        code: 400,
        expectedRetryable: false,
        expectedMessage: "Invalid request. Please check your parameters.",
      },
    ];

    testCases.forEach(({ code, expectedRetryable, expectedMessage }) => {
      const error = parsePlatformError({ statusCode: code }, "google");

      expect(error).toBeInstanceOf(PlatformError);
      expect(error.retryable).toBe(expectedRetryable);
      expect(error.userMessage).toBe(expectedMessage);
      expect(error.platform).toBe("google");
    });
  });

  test("should parse platform-specific error codes", () => {
    // Google Ads specific errors
    const googleError = parsePlatformError({ code: 403 }, "google");
    expect(googleError.userMessage).toBe(
      "Google Ads authentication failed. Please reconnect your account.",
    );
    expect(googleError.code).toBe("AUTH_ERROR");

    // Facebook specific errors
    const facebookError = parsePlatformError({ code: 190 }, "facebook");
    expect(facebookError.userMessage).toBe(
      "Facebook authentication failed. Please reconnect your account.",
    );
    expect(facebookError.code).toBe("AUTH_ERROR");

    // TikTok specific errors
    const tiktokError = parsePlatformError({ code: 40100 }, "tiktok");
    expect(tiktokError.userMessage).toBe(
      "TikTok authentication failed. Please reconnect your account.",
    );
    expect(tiktokError.code).toBe("AUTH_ERROR");
  });

  test("should handle axios-style errors", () => {
    const axiosError = {
      response: {
        status: 401,
        data: {
          error: {
            code: 401,
            message: "Unauthorized request",
          },
        },
      },
    };

    const error = parsePlatformError(axiosError, "amazon");
    expect(error.retryable).toBe(true);
    expect(error.userMessage).toBe(
      "Amazon Ads authentication failed. Please reconnect your account.",
    );
  });

  test("should detect network errors", () => {
    const networkErrors = [
      { message: "Network request failed" },
      { message: "fetch timeout" },
      { message: "Connection timeout" },
    ];

    networkErrors.forEach((errorObj) => {
      const error = parsePlatformError(errorObj, "google");
      expect(error.retryable).toBe(true);
      expect(error.code).toBe("NETWORK_ERROR");
      expect(error.userMessage).toBe(
        "Network connection issue. Please check your internet connection.",
      );
    });
  });

  test("should handle unknown errors gracefully", () => {
    const unknownError = { message: "Something went wrong" };

    const error = parsePlatformError(unknownError, "naver");
    expect(error.retryable).toBe(false);
    expect(error.code).toBe("UNKNOWN_ERROR");
    expect(error.userMessage).toBe(
      "An error occurred with naver. Please try again or contact support.",
    );
  });

  test("should correctly identify retryable errors", () => {
    const retryableError = new PlatformError(
      "Rate limit exceeded",
      "google",
      "RATE_LIMIT",
      true,
      "Rate limit exceeded",
    );

    const nonRetryableError = new PlatformError(
      "Invalid request",
      "google",
      "INVALID_REQUEST",
      false,
      "Invalid request",
    );

    const networkError = new Error("Network request failed");

    expect(isRetryableError(retryableError)).toBe(true);
    expect(isRetryableError(nonRetryableError)).toBe(false);
    expect(isRetryableError(networkError)).toBe(true);
  });

  test("should extract error codes from different formats", () => {
    const testCases = [
      { error: { code: 404 }, expected: 404 },
      { error: { statusCode: 500 }, expected: 500 },
      { error: { response: { status: 401 } }, expected: 401 },
      {
        error: { response: { data: { error: { code: 429 } } } },
        expected: 429,
      },
      { error: { error_code: "AUTH_ERROR" }, expected: "AUTH_ERROR" },
      { error: { message: "Something went wrong" }, expected: undefined },
    ];

    testCases.forEach(({ error, expected }) => {
      expect(extractErrorCode(error)).toBe(expected);
    });
  });

  test("should create user-friendly error messages", () => {
    const platformError = new PlatformError(
      "Internal error",
      "facebook",
      "AUTH_ERROR",
      true,
      "Facebook auth failed",
    );

    const regularError = { code: 404, message: "Not found" };
    const unknownError = new Error("Something went wrong");

    expect(
      createUserErrorMessage(platformError, "facebook", "fetch campaigns"),
    ).toBe("Facebook auth failed");

    expect(
      createUserErrorMessage(regularError, "google", "update budget"),
    ).toBe("google error (404) during update budget. Please try again.");

    expect(createUserErrorMessage(unknownError, "amazon", "sync data")).toBe(
      "An error occurred with amazon during sync data. Please try again.",
    );
  });

  test("should handle platform-specific rate limit codes", () => {
    const platforms: Array<{ platform: PlatformType; codes: number[] }> = [
      { platform: "facebook", codes: [17, 32, 613] },
      { platform: "tiktok", codes: [40001] },
      { platform: "amazon", codes: [429] },
    ];

    platforms.forEach(({ platform, codes }) => {
      codes.forEach((code) => {
        const error = parsePlatformError({ code }, platform);
        expect(error.retryable).toBe(true);
        expect(error.code).toContain("RATE_LIMIT");
      });
    });
  });

  test("should prioritize platform-specific mappings over common ones", () => {
    // Facebook has specific error code 190 for auth, should use Facebook-specific message
    const facebookAuthError = parsePlatformError({ code: 190 }, "facebook");
    expect(facebookAuthError.userMessage).toBe(
      "Facebook authentication failed. Please reconnect your account.",
    );

    // Google with 401 should use Google-specific message
    const googleAuthError = parsePlatformError({ code: 401 }, "google");
    expect(googleAuthError.userMessage).toBe(
      "Google Ads authentication failed. Please reconnect your account.",
    );

    // Unsupported platform with 401 should use common message
    const commonAuthError = parsePlatformError({ code: 401 }, "coupang");
    expect(commonAuthError.userMessage).toBe(
      "Authentication failed. Please reconnect your account.",
    );
  });

  test("should handle Coupang platform with different retry policy", () => {
    const coupangAuthError = parsePlatformError({ code: 401 }, "coupang");
    expect(coupangAuthError.retryable).toBe(false);
    expect(coupangAuthError.userMessage).toBe(
      "Coupang authentication failed. Please check your credentials.",
    );
  });

  test("should handle TikTok server errors", () => {
    const serverErrorCodes = [50001, 50002];

    serverErrorCodes.forEach((code) => {
      const error = parsePlatformError({ code }, "tiktok");
      expect(error.retryable).toBe(true);
      expect(error.code).toBe("API_ERROR");
      expect(error.userMessage).toBe(
        "TikTok server error. Please try again later.",
      );
    });
  });
});
