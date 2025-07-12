// 의존성 주입 부트스트래핑

import { SupabaseClient } from "@supabase/supabase-js";

import { container, ServiceTokens } from "./container";

import { PlatformServiceFactory } from "@/services/platforms/platform-service-factory";
import { GoogleAdsPlatformService } from "@/services/platforms/google-ads-platform.service";
import { GoogleAdsOAuthPlatformService } from "@/services/platforms/google-ads-oauth-platform.service";
import { FacebookPlatformService } from "@/services/platforms/facebook-platform.service";
import { NaverPlatformService } from "@/services/platforms/naver-platform.service";
import { KakaoPlatformService } from "@/services/platforms/kakao-platform.service";
import { CoupangPlatformService } from "@/services/platforms/coupang-platform.service";
import { AmazonPlatformService } from "@/services/platforms/amazon-platform.service";
import { PlatformSyncService } from "@/services/platform-sync.service";
import { PlatformDatabaseService } from "@/services/platform-database.service";
import { AdService } from "@/services/ads/ad-service";
import { GoogleAdsClient } from "@/services/google-ads/core/google-ads-client";
import { CampaignControlService } from "@/services/google-ads/campaign/campaign-control.service";
import { LabelManagementService } from "@/services/google-ads/label/label-management.service";
import { GoogleAdsSyncService } from "@/services/google-ads/sync/sync-strategy.service";
import { GoogleAdsIntegrationService } from "@/services/google-ads/google-ads-integration.service";
import { getRedisClient } from "@/lib/redis";
import { createClient as createSupabaseClient } from "@/utils/supabase/server";
import { GoogleAdsCredentials } from "@/types/google-ads.types";
import log from "@/utils/logger";

// 서비스 등록 함수
export async function bootstrapDI() {
  // Infrastructure
  container.registerSingleton(ServiceTokens.REDIS_CLIENT, () =>
    getRedisClient(),
  );
  container.register(
    ServiceTokens.SUPABASE_CLIENT,
    async () => await createSupabaseClient(),
  );

  // Platform Services
  container.registerSingleton(ServiceTokens.GOOGLE_PLATFORM_SERVICE, () => {
    // Use OAuth version for simplified authentication
    const useOAuth =
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;

    return useOAuth
      ? new GoogleAdsOAuthPlatformService()
      : new GoogleAdsPlatformService();
  });
  container.registerSingleton(
    ServiceTokens.FACEBOOK_PLATFORM_SERVICE,
    () => new FacebookPlatformService(),
  );
  container.registerSingleton(
    ServiceTokens.NAVER_PLATFORM_SERVICE,
    () => new NaverPlatformService(),
  );
  container.registerSingleton(
    ServiceTokens.KAKAO_PLATFORM_SERVICE,
    () => new KakaoPlatformService(),
  );
  container.registerSingleton(
    ServiceTokens.COUPANG_PLATFORM_SERVICE,
    () => new CoupangPlatformService(),
  );
  container.registerSingleton(
    ServiceTokens.AMAZON_PLATFORM_SERVICE,
    () => new AmazonPlatformService(),
  );

  // Platform Service Factory
  container.registerSingleton(
    ServiceTokens.PLATFORM_SERVICE_FACTORY,
    async () => {
      const factory = new PlatformServiceFactory();

      // 팩토리에 서비스 등록
      factory.register(
        "google",
        await container.resolve(ServiceTokens.GOOGLE_PLATFORM_SERVICE),
      );
      factory.register(
        "facebook",
        await container.resolve(ServiceTokens.FACEBOOK_PLATFORM_SERVICE),
      );
      factory.register(
        "naver",
        await container.resolve(ServiceTokens.NAVER_PLATFORM_SERVICE),
      );
      factory.register(
        "kakao",
        await container.resolve(ServiceTokens.KAKAO_PLATFORM_SERVICE),
      );
      factory.register(
        "coupang",
        await container.resolve(ServiceTokens.COUPANG_PLATFORM_SERVICE),
      );
      factory.register(
        "amazon" as any,
        await container.resolve(ServiceTokens.AMAZON_PLATFORM_SERVICE),
      );

      return factory;
    },
  );

  // Core Services
  container.registerSingleton(
    ServiceTokens.PLATFORM_DATABASE_SERVICE,
    async () => {
      const supabase = await container.resolve<SupabaseClient>(
        ServiceTokens.SUPABASE_CLIENT,
      );

      // Create a logger adapter that matches the expected interface
      const loggerAdapter = {
        debug: (message: string, ...args: unknown[]) =>
          log.debug(message, args[0] as Record<string, unknown>),
        info: (message: string, ...args: unknown[]) =>
          log.info(message, args[0] as Record<string, unknown>),
        warn: (message: string, ...args: unknown[]) =>
          log.warn(message, args[0] as Record<string, unknown>),
        error: (message: string, ...args: unknown[]) =>
          log.error(
            message,
            args[0] as Error | string | unknown,
            args[1] as Record<string, unknown>,
          ),
      };

      return new PlatformDatabaseService(supabase, loggerAdapter);
    },
  );

  container.registerSingleton(ServiceTokens.PLATFORM_SYNC_SERVICE, async () => {
    const platformFactory = await container.resolve<PlatformServiceFactory>(
      ServiceTokens.PLATFORM_SERVICE_FACTORY,
    );
    const databaseService = await container.resolve<PlatformDatabaseService>(
      ServiceTokens.PLATFORM_DATABASE_SERVICE,
    );

    // Reuse the same logger adapter pattern
    const loggerAdapter = {
      debug: (message: string, ...args: unknown[]) =>
        log.debug(message, args[0] as Record<string, unknown>),
      info: (message: string, ...args: unknown[]) =>
        log.info(message, args[0] as Record<string, unknown>),
      warn: (message: string, ...args: unknown[]) =>
        log.warn(message, args[0] as Record<string, unknown>),
      error: (message: string, ...args: unknown[]) =>
        log.error(
          message,
          args[0] as Error | string | unknown,
          args[1] as Record<string, unknown>,
        ),
    };

    return new PlatformSyncService(
      platformFactory,
      databaseService,
      loggerAdapter,
    );
  });

  container.registerSingleton(ServiceTokens.AD_SERVICE, () => {
    return new AdService();
  });

  // Google Ads Services
  container.register(ServiceTokens.GOOGLE_ADS_CLIENT, () => {
    // 이 서비스는 credentials가 필요하므로 팩토리 패턴 사용
    return (credentials: GoogleAdsCredentials) =>
      new GoogleAdsClient(credentials);
  });

  container.register(ServiceTokens.CAMPAIGN_CONTROL_SERVICE, () => {
    // CampaignControlService requires GoogleAdsClient in constructor
    return (googleAdsClient: GoogleAdsClient) =>
      new CampaignControlService(googleAdsClient);
  });

  container.register(ServiceTokens.LABEL_MANAGEMENT_SERVICE, () => {
    // LabelManagementService requires GoogleAdsClient in constructor
    return (googleAdsClient: GoogleAdsClient) =>
      new LabelManagementService(googleAdsClient);
  });

  container.registerSingleton(ServiceTokens.GOOGLE_ADS_SYNC_SERVICE, () => {
    // GoogleAdsSyncService only requires GoogleAdsClient in constructor
    return (googleAdsClient: GoogleAdsClient) =>
      new GoogleAdsSyncService(googleAdsClient);
  });

  container.registerSingleton(
    ServiceTokens.GOOGLE_ADS_INTEGRATION_SERVICE,
    () => {
      // GoogleAdsIntegrationService requires credentials
      return (credentials: GoogleAdsCredentials) =>
        new GoogleAdsIntegrationService(credentials);
    },
  );
}
