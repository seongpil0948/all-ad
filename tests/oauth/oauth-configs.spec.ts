import { test, expect } from "@playwright/test";

import { getOAuthConfig } from "@/lib/oauth/platform-configs";
import type { PlatformType } from "@/types";

test.describe("OAuth Configuration Tests", () => {
  test.beforeEach(() => {
    // Set required environment variables for testing
    process.env.GOOGLE_CLIENT_ID = "test-google-client-id";
    process.env.GOOGLE_CLIENT_SECRET = "test-google-client-secret";
    process.env.GOOGLE_DEVELOPER_TOKEN = "test-developer-token";
    process.env.META_APP_ID = "test-meta-app-id";
    process.env.META_APP_SECRET = "test-meta-app-secret";
    process.env.AMAZON_CLIENT_ID = "test-amazon-client-id";
    process.env.AMAZON_CLIENT_SECRET = "test-amazon-client-secret";
    process.env.TIKTOK_APP_ID = "test-tiktok-app-id";
    process.env.TIKTOK_APP_SECRET = "test-tiktok-app-secret";
    process.env.KAKAO_CLIENT_ID = "test-kakao-client-id";
    process.env.KAKAO_CLIENT_SECRET = "test-kakao-client-secret";
    process.env.NAVER_CLIENT_ID = "test-naver-client-id";
    process.env.NAVER_CLIENT_SECRET = "test-naver-client-secret";
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
  });

  test("should return Google OAuth config with credentials", async () => {
    const config = await getOAuthConfig("google");

    expect(config).toBeDefined();
    expect(config?.clientId).toBe("test-google-client-id");
    expect(config?.clientSecret).toBe("test-google-client-secret");
    expect(config?.developerToken).toBe("test-developer-token");
    expect(config?.authorizationUrl).toBe(
      "https://accounts.google.com/o/oauth2/v2/auth",
    );
    expect(config?.scope).toContain("https://www.googleapis.com/auth/adwords");
  });

  test("should return Meta OAuth config with credentials", async () => {
    const config = await getOAuthConfig("meta");

    expect(config).toBeDefined();
    expect(config?.clientId).toBe("test-meta-app-id");
    expect(config?.clientSecret).toBe("test-meta-app-secret");
    expect(config?.authorizationUrl).toBe(
      "https://www.facebook.com/v23.0/dialog/oauth",
    );
    expect(config?.scope).toContain("ads_management");
  });

  test("should return Amazon OAuth config with credentials", async () => {
    const config = await getOAuthConfig("amazon");

    expect(config).toBeDefined();
    expect(config?.clientId).toBe("test-amazon-client-id");
    expect(config?.clientSecret).toBe("test-amazon-client-secret");
    expect(config?.authorizationUrl).toBe("https://www.amazon.com/ap/oa");
    expect(config?.scope).toContain("advertising::campaign_management");
  });

  test("should return TikTok OAuth config with credentials", async () => {
    const config = await getOAuthConfig("tiktok");

    expect(config).toBeDefined();
    expect(config?.clientId).toBe("test-tiktok-app-id");
    expect(config?.clientSecret).toBe("test-tiktok-app-secret");
    expect(config?.authorizationUrl).toBe(
      "https://www.tiktok.com/v2/auth/authorize/",
    );
    expect(config?.scope).toContain("ads.management");
  });

  test("should return Kakao OAuth config with credentials", async () => {
    const config = await getOAuthConfig("kakao");

    expect(config).toBeDefined();
    expect(config?.clientId).toBe("test-kakao-client-id");
    expect(config?.clientSecret).toBe("test-kakao-client-secret");
    expect(config?.authorizationUrl).toBe(
      "https://kauth.kakao.com/oauth/authorize",
    );
    expect(config?.scope).toContain("moment:read");
  });

  test("should return Naver OAuth config with credentials", async () => {
    const config = await getOAuthConfig("naver");

    expect(config).toBeDefined();
    expect(config?.clientId).toBe("test-naver-client-id");
    expect(config?.clientSecret).toBe("test-naver-client-secret");
    expect(config?.authorizationUrl).toBe(
      "https://nid.naver.com/oauth2.0/authorize",
    );
    expect(config?.scope).toContain("ncc.searchad");
  });

  test("should return null for unsupported platform", async () => {
    const config = await getOAuthConfig("unsupported" as PlatformType);
    expect(config).toBeNull();
  });

  test("should return null when environment variables are missing", async () => {
    // Save original values
    const originalClientId = process.env.GOOGLE_CLIENT_ID;
    const originalClientSecret = process.env.GOOGLE_CLIENT_SECRET;

    // Clear environment variables
    process.env.GOOGLE_CLIENT_ID = "";
    process.env.GOOGLE_CLIENT_SECRET = "";

    const config = await getOAuthConfig("google");
    expect(config).toBeNull();

    // Restore original values
    if (originalClientId) process.env.GOOGLE_CLIENT_ID = originalClientId;
    if (originalClientSecret)
      process.env.GOOGLE_CLIENT_SECRET = originalClientSecret;
  });

  test("should have correct redirect URIs", async () => {
    const platforms = ["google", "meta", "amazon", "kakao", "naver", "tiktok"];

    for (const platform of platforms) {
      const config = await getOAuthConfig(platform);
      if (config) {
        expect(config.redirectUri).toContain("http://localhost:3000");
        expect(config.redirectUri).toContain("/api/auth/");
      }
    }
  });

  test("should have valid token URLs", async () => {
    const expectedTokenUrls = {
      google: "https://oauth2.googleapis.com/token",
      meta: "https://graph.facebook.com/v23.0/oauth/access_token",
      amazon: "https://api.amazon.com/auth/o2/token",
      kakao: "https://kauth.kakao.com/oauth/token",
      naver: "https://nid.naver.com/oauth2.0/token",
      tiktok:
        "https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/",
    };

    for (const [platform, expectedUrl] of Object.entries(expectedTokenUrls)) {
      const config = await getOAuthConfig(platform);
      expect(config?.tokenUrl).toBe(expectedUrl);
    }
  });
});
