import { test, expect } from "@playwright/test";

test.describe("Platform Credentials API Tests", () => {
  test.beforeEach(async () => {
    // Set up test environment
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
  });

  test("should validate OAuth route parameters", async ({ request }) => {
    // Test invalid platform
    const invalidResponse = await request.get("/api/auth/oauth/invalid");
    expect(invalidResponse.status()).toBe(400);

    const invalidData = await invalidResponse.json();
    expect(invalidData.error).toBe("Invalid platform");
  });

  test("should accept valid platform parameters", async ({ request }) => {
    const validPlatforms = [
      "google",
      "facebook",
      "kakao",
      "amazon",
      "naver",
      "coupang",
      "tiktok",
    ];

    for (const platform of validPlatforms) {
      // Note: This will redirect to login since we're not authenticated
      // but it should not return a 400 error for invalid platform
      const response = await request.get(`/api/auth/oauth/${platform}`, {
        maxRedirects: 0, // Don't follow redirects
      });

      // Should redirect (302) or require auth, not return 400 for invalid platform
      expect(response.status()).not.toBe(400);
    }
  });

  test("should require authentication for OAuth initiation", async ({
    request,
  }) => {
    const response = await request.get("/api/auth/oauth/google", {
      maxRedirects: 0,
    });

    // Should redirect to login when not authenticated
    expect([302, 307]).toContain(response.status());
  });

  test("platform service factory should be importable", () => {
    expect(() => {
      const {
        getPlatformServiceFactory,
      } = require("@/services/platforms/platform-service-factory");
      const factory = getPlatformServiceFactory();
      expect(factory).toBeDefined();
    }).not.toThrow();
  });

  test("OAuth configs should be importable", () => {
    expect(() => {
      const { getOAuthConfig } = require("@/lib/oauth/platform-configs");
      expect(getOAuthConfig).toBeDefined();
    }).not.toThrow();
  });

  test("unified OAuth handler should be importable", () => {
    expect(() => {
      const {
        handleOAuthInitiation,
      } = require("@/lib/auth/unified-oauth-handler");
      expect(handleOAuthInitiation).toBeDefined();
    }).not.toThrow();
  });
});
