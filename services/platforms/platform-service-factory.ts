import {
  PlatformService,
  PlatformIntegrationService,
  PlatformServiceFactory as IPlatformServiceFactory,
  PlatformCredentials,
} from "./platform-service.interface";
import { BasePlatformServiceFactory } from "./base-platform.service";
import { GoogleAdsOAuthPlatformService } from "./google-ads-oauth-platform.service";
import { AmazonPlatformService } from "./amazon-platform.service";
import { FacebookPlatformService } from "./facebook-platform.service";
import { TikTokPlatformService } from "./tiktok-platform.service";
import { KakaoPlatformService } from "./kakao-platform.service";
import { NaverPlatformService } from "./naver-platform.service";
import { CoupangPlatformService } from "./coupang-platform.service";

import { PlatformConfigError } from "@/types/platform-errors.types";
import { PlatformType } from "@/types";
import log from "@/utils/logger";

export class PlatformServiceFactory
  extends BasePlatformServiceFactory
  implements IPlatformServiceFactory
{
  private services: Map<PlatformType, () => PlatformService>;
  private integrationServices: Map<
    PlatformType,
    () => PlatformIntegrationService
  >;

  constructor() {
    super();
    this.services = new Map();
    this.integrationServices = new Map();
    this.initializeServices();
  }

  private initializeServices(): void {
    // Register platform services
    this.services.set("google", () => new GoogleAdsOAuthPlatformService());
    this.services.set("facebook", () => new FacebookPlatformService());
    this.services.set("amazon", () => new AmazonPlatformService());
    this.services.set("tiktok", () => new TikTokPlatformService());
    this.services.set("kakao", () => new KakaoPlatformService());
    this.services.set("naver", () => new NaverPlatformService());
    this.services.set("coupang", () => new CoupangPlatformService());

    // Register integration services (for future use)
    // this.integrationServices.set("google", () => new GoogleAdsIntegrationService());
    // this.integrationServices.set("facebook", () => new MetaAdsIntegrationService());
    // this.integrationServices.set("amazon", () => new AmazonAdsIntegrationService());

    log.info("Platform service factory initialized", {
      availablePlatforms: this.getAvailablePlatforms(),
    });
  }

  createService(platform: PlatformType): PlatformService {
    this.validatePlatformSupport(platform);

    const serviceFactory = this.services.get(platform);

    if (!serviceFactory) {
      throw new PlatformConfigError(
        platform,
        `Platform service not registered for: ${platform}`,
      );
    }

    try {
      const service = serviceFactory();

      log.info(`Created ${platform} platform service`);

      return service;
    } catch (error) {
      throw new PlatformConfigError(
        platform,
        `Failed to create ${platform} platform service`,
        undefined,
        error instanceof Error ? error : undefined,
      );
    }
  }

  createIntegrationService(platform: PlatformType): PlatformIntegrationService {
    this.validatePlatformSupport(platform);

    const serviceFactory = this.integrationServices.get(platform);

    if (!serviceFactory) {
      throw new PlatformConfigError(
        platform,
        `Platform integration service not registered for: ${platform}`,
      );
    }

    try {
      const service = serviceFactory();

      log.info(`Created ${platform} integration service`);

      return service;
    } catch (error) {
      throw new PlatformConfigError(
        platform,
        `Failed to create ${platform} integration service`,
        undefined,
        error instanceof Error ? error : undefined,
      );
    }
  }

  // Convenience method to create and initialize a service
  async createAndInitializeService(
    platform: PlatformType,
    credentials: PlatformCredentials,
  ): Promise<PlatformService> {
    const service = this.createService(platform);

    if ("initialize" in service && typeof service.initialize === "function") {
      await service.initialize(credentials);
    } else {
      service.setCredentials(credentials);
    }

    return service;
  }

  // Register custom service
  register(
    platform: PlatformType,
    serviceFactory: () => PlatformService,
  ): void {
    this.services.set(platform, serviceFactory);
    log.info(`Registered custom service for platform: ${platform}`);
  }

  // Register custom integration service
  registerIntegration(
    platform: PlatformType,
    serviceFactory: () => PlatformIntegrationService,
  ): void {
    this.integrationServices.set(platform, serviceFactory);
    log.info(`Registered custom integration service for platform: ${platform}`);
  }

  getAvailablePlatforms(): PlatformType[] {
    return Array.from(this.services.keys());
  }

  getAvailableIntegrationPlatforms(): PlatformType[] {
    return Array.from(this.integrationServices.keys());
  }

  // Check if platform is supported
  isPlatformSupported(platform: PlatformType): boolean {
    return this.services.has(platform);
  }

  // Check if integration platform is supported
  isIntegrationPlatformSupported(platform: PlatformType): boolean {
    return this.integrationServices.has(platform);
  }

  // Get platform service info
  getPlatformInfo(platform: PlatformType): {
    hasService: boolean;
    hasIntegration: boolean;
    supportedFeatures: string[];
  } {
    const hasService = this.isPlatformSupported(platform);
    const hasIntegration = this.isIntegrationPlatformSupported(platform);

    // Define supported features per platform
    const platformFeatures: Record<PlatformType, string[]> = {
      google: [
        "campaigns",
        "keywords",
        "ads",
        "audiences",
        "reporting",
        "oauth",
        "auto-refresh",
      ],
      facebook: [
        "campaigns",
        "adsets",
        "ads",
        "audiences",
        "reporting",
        "oauth",
        "batch-operations",
      ],
      amazon: ["campaigns", "keywords", "targets", "reporting", "multi-region"],
      kakao: ["campaigns", "reporting"],
      naver: ["campaigns", "keywords", "reporting"],
      coupang: ["manual-campaigns"],
      tiktok: [
        "campaigns",
        "adgroups",
        "ads",
        "audiences",
        "reporting",
        "oauth",
      ],
    };

    return {
      hasService,
      hasIntegration,
      supportedFeatures: platformFeatures[platform] || [],
    };
  }

  // Cleanup all services
  async cleanup(): Promise<void> {
    log.info("Cleaning up platform service factory");
    // Individual services should handle their own cleanup
    // when they're garbage collected or explicitly cleaned up
  }
}

// Singleton instance
let factoryInstance: PlatformServiceFactory | null = null;

export function getPlatformServiceFactory(): PlatformServiceFactory {
  if (!factoryInstance) {
    factoryInstance = new PlatformServiceFactory();
  }

  return factoryInstance;
}

// Legacy support - use GoogleAdsOAuthPlatformService for OAuth flow
export { GoogleAdsPlatformService } from "./google-ads-platform.service";
export { GoogleAdsOAuthPlatformService } from "./google-ads-oauth-platform.service";
export { AmazonPlatformService } from "./amazon-platform.service";
export { FacebookPlatformService } from "./facebook-platform.service";
export { TikTokPlatformService } from "./tiktok-platform.service";
