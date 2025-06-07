// 의존성 주입 부트스트래핑

import { SupabaseClient } from "@supabase/supabase-js";

import { container, ServiceTokens } from "./container";

import { PlatformServiceFactory } from "@/services/platforms/platform-service-factory";
import { GooglePlatformService } from "@/services/platforms/google-platform.service";
import { FacebookPlatformService } from "@/services/platforms/facebook-platform.service";
import { NaverPlatformService } from "@/services/platforms/naver-platform.service";
import { KakaoPlatformService } from "@/services/platforms/kakao-platform.service";
import { CoupangPlatformService } from "@/services/platforms/coupang-platform.service";
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
import { GoogleAdsApiCredentials } from "@/types/google-ads.types";
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
  container.registerSingleton(ServiceTokens.LOGGER, () => log);

  // Platform Services
  container.registerSingleton(
    ServiceTokens.GOOGLE_PLATFORM_SERVICE,
    () => new GooglePlatformService(),
  );
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
      const logger = await container.resolve<typeof log>(ServiceTokens.LOGGER);

      return new PlatformDatabaseService(supabase, logger);
    },
  );

  container.registerSingleton(ServiceTokens.PLATFORM_SYNC_SERVICE, async () => {
    const platformFactory = await container.resolve<PlatformServiceFactory>(
      ServiceTokens.PLATFORM_SERVICE_FACTORY,
    );
    const databaseService = await container.resolve<PlatformDatabaseService>(
      ServiceTokens.PLATFORM_DATABASE_SERVICE,
    );
    const logger = await container.resolve<typeof log>(ServiceTokens.LOGGER);

    return new PlatformSyncService(platformFactory, databaseService, logger);
  });

  container.registerSingleton(ServiceTokens.AD_SERVICE, () => {
    return new AdService();
  });

  // Google Ads Services
  container.register(ServiceTokens.GOOGLE_ADS_CLIENT, () => {
    // 이 서비스는 credentials가 필요하므로 팩토리 패턴 사용
    return (credentials: GoogleAdsApiCredentials) =>
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
      return (credentials: GoogleAdsApiCredentials) =>
        new GoogleAdsIntegrationService(credentials);
    },
  );
}
