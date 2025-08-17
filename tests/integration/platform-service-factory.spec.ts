import { test, expect } from "@playwright/test";
import {
  PlatformServiceFactory,
  getPlatformServiceFactory,
} from "@/services/platforms/platform-service-factory";
import type { PlatformType } from "@/types";

test.describe("PlatformServiceFactory Unit Tests", () => {
  let factory: PlatformServiceFactory;

  test.beforeEach(() => {
    factory = new PlatformServiceFactory();
  });

  test("should create factory instance", () => {
    expect(factory).toBeDefined();
    expect(factory).toBeInstanceOf(PlatformServiceFactory);
  });

  test("should return singleton instance", () => {
    const instance1 = getPlatformServiceFactory();
    const instance2 = getPlatformServiceFactory();

    expect(instance1).toBe(instance2);
  });

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

    expectedPlatforms.forEach((platform) => {
      expect(availablePlatforms).toContain(platform);
    });
  });

  test("should create service for each supported platform", () => {
    const platforms: PlatformType[] = [
      "google",
      "facebook",
      "amazon",
      "tiktok",
      "kakao",
      "naver",
      "coupang",
    ];

    platforms.forEach((platform) => {
      expect(() => {
        const service = factory.createService(platform);
        expect(service).toBeDefined();
        expect(service.platform).toBe(platform);
      }).not.toThrow();
    });
  });

  test("should throw error for unsupported platform", () => {
    expect(() => {
      factory.createService("unsupported" as PlatformType);
    }).toThrow();
  });

  test("should check platform support correctly", () => {
    expect(factory.isPlatformSupported("google")).toBe(true);
    expect(factory.isPlatformSupported("facebook")).toBe(true);
    expect(factory.isPlatformSupported("tiktok")).toBe(true);
    expect(factory.isPlatformSupported("unsupported" as PlatformType)).toBe(
      false,
    );
  });

  test("should return platform info with features", () => {
    const platforms: PlatformType[] = [
      "google",
      "facebook",
      "amazon",
      "tiktok",
    ];

    platforms.forEach((platform) => {
      const info = factory.getPlatformInfo(platform);

      expect(info).toBeDefined();
      expect(info.hasService).toBe(true);
      expect(info.supportedFeatures).toBeDefined();
      expect(Array.isArray(info.supportedFeatures)).toBe(true);
      expect(info.supportedFeatures.length).toBeGreaterThan(0);
    });
  });

  test("should have OAuth support for appropriate platforms", () => {
    const oauthPlatforms: PlatformType[] = ["google", "facebook", "tiktok"];

    oauthPlatforms.forEach((platform) => {
      const info = factory.getPlatformInfo(platform);
      expect(info.supportedFeatures).toContain("oauth");
    });
  });

  test("should have campaign support for all platforms", () => {
    const platforms: PlatformType[] = [
      "google",
      "facebook",
      "amazon",
      "tiktok",
      "kakao",
      "naver",
    ];

    platforms.forEach((platform) => {
      const info = factory.getPlatformInfo(platform);
      expect(
        info.supportedFeatures.includes("campaigns") ||
          info.supportedFeatures.includes("manual-campaigns"),
      ).toBe(true);
    });
  });

  test("should allow custom service registration", () => {
    const customPlatform = "custom" as PlatformType;
    const mockServiceFactory = jest.fn(() => ({
      platform: customPlatform,
      setCredentials: jest.fn(),
      testConnection: jest.fn(),
      validateCredentials: jest.fn(),
      refreshToken: jest.fn(),
      fetchCampaigns: jest.fn(),
      fetchCampaignMetrics: jest.fn(),
      updateCampaignBudget: jest.fn(),
      updateCampaignStatus: jest.fn(),
      getAccountInfo: jest.fn(),
    }));

    expect(factory.isPlatformSupported(customPlatform)).toBe(false);

    factory.register(customPlatform, mockServiceFactory);

    expect(factory.isPlatformSupported(customPlatform)).toBe(true);
    expect(() => {
      const service = factory.createService(customPlatform);
      expect(service.platform).toBe(customPlatform);
    }).not.toThrow();
  });

  test("should handle service creation errors gracefully", () => {
    const errorPlatform = "error" as PlatformType;
    const errorServiceFactory = () => {
      throw new Error("Service creation failed");
    };

    factory.register(errorPlatform, errorServiceFactory);

    expect(() => {
      factory.createService(errorPlatform);
    }).toThrow("Failed to create error platform service");
  });

  test("should validate platform support before creating service", () => {
    // Mock validatePlatformSupport to throw
    const originalMethod = factory["validatePlatformSupport"];
    factory["validatePlatformSupport"] = jest.fn(() => {
      throw new Error("Platform not supported");
    });

    expect(() => {
      factory.createService("google");
    }).toThrow("Platform not supported");

    // Restore original method
    factory["validatePlatformSupport"] = originalMethod;
  });
});
