import { test, expect } from "@playwright/test";

import { getPlatformServiceFactory } from "@/services/platforms/platform-service-factory";
import { PlatformType } from "@/types";

test.describe("Platform Services Integration Tests", () => {
  const factory = getPlatformServiceFactory();

  test("should have all required platforms registered", () => {
    const expectedPlatforms: PlatformType[] = [
      "google",
      "facebook",
      "amazon",
      "tiktok",
      "kakao",
      "naver",
      "coupang",
    ];

    const availablePlatforms = factory.getAvailablePlatforms();

    for (const platform of expectedPlatforms) {
      expect(availablePlatforms).toContain(platform);
    }
  });

  test("should create platform services successfully", () => {
    const platforms: PlatformType[] = [
      "google",
      "facebook",
      "amazon",
      "tiktok",
      "kakao",
      "naver",
      "coupang",
    ];

    for (const platform of platforms) {
      expect(() => {
        const service = factory.createService(platform);
        expect(service).toBeDefined();
        expect(service.platform).toBe(platform);
      }).not.toThrow();
    }
  });

  test("should return correct platform info", () => {
    const platforms: PlatformType[] = [
      "google",
      "facebook",
      "amazon",
      "tiktok",
      "kakao",
      "naver",
      "coupang",
    ];

    for (const platform of platforms) {
      const info = factory.getPlatformInfo(platform);

      expect(info.hasService).toBe(true);
      expect(info.supportedFeatures).toBeDefined();
      expect(Array.isArray(info.supportedFeatures)).toBe(true);
      expect(info.supportedFeatures.length).toBeGreaterThan(0);
    }
  });

  test("should handle invalid platform gracefully", () => {
    expect(() => {
      factory.createService("invalid" as PlatformType);
    }).toThrow();
  });

  test("Google Ads platform should have OAuth support", () => {
    const info = factory.getPlatformInfo("google");
    expect(info.supportedFeatures).toContain("oauth");
    expect(info.supportedFeatures).toContain("campaigns");
    expect(info.supportedFeatures).toContain("reporting");
  });

  test("TikTok platform should have required features", () => {
    const info = factory.getPlatformInfo("tiktok");
    expect(info.supportedFeatures).toContain("oauth");
    expect(info.supportedFeatures).toContain("campaigns");
    expect(info.supportedFeatures).toContain("adgroups");
    expect(info.supportedFeatures).toContain("reporting");
  });

  test("Korean platforms should have campaigns support", () => {
    const koreanPlatforms: PlatformType[] = ["kakao", "naver"];

    for (const platform of koreanPlatforms) {
      const info = factory.getPlatformInfo(platform);
      expect(info.supportedFeatures).toContain("campaigns");
      expect(info.supportedFeatures).toContain("reporting");
    }
  });

  test("Coupang should have manual campaigns support", () => {
    const info = factory.getPlatformInfo("coupang");
    expect(info.supportedFeatures).toContain("manual-campaigns");
  });

  test("Amazon should have multi-region support", () => {
    const info = factory.getPlatformInfo("amazon");
    expect(info.supportedFeatures).toContain("multi-region");
    expect(info.supportedFeatures).toContain("campaigns");
    expect(info.supportedFeatures).toContain("targets");
  });

  test("Meta/Facebook should have batch operations support", () => {
    const info = factory.getPlatformInfo("facebook");
    expect(info.supportedFeatures).toContain("batch-operations");
    expect(info.supportedFeatures).toContain("oauth");
    expect(info.supportedFeatures).toContain("audiences");
  });
});
