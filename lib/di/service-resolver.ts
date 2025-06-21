// 서비스 리졸버 헬퍼 함수

import type { PlatformServiceFactory } from "@/services/platforms/platform-service-factory";
import type { PlatformSyncService } from "@/services/platform-sync.service";
import type { PlatformDatabaseService } from "@/services/platform-database.service";
import type { AdService } from "@/services/ads/ad-service";
import type { GoogleAdsIntegrationService } from "@/services/google-ads/google-ads-integration.service";
import type { RedisClient } from "@/types/redis";

import { bootstrapDI } from "./bootstrap";
import { container, ServiceTokens } from "./container";

let isBootstrapped = false;

// 부트스트랩 확인 및 실행
async function ensureBootstrapped() {
  if (!isBootstrapped) {
    await bootstrapDI();
    isBootstrapped = true;
  }
}

// 타입 안전한 서비스 getter 함수들
export async function getPlatformServiceFactory(): Promise<PlatformServiceFactory> {
  await ensureBootstrapped();

  return container.resolve<PlatformServiceFactory>(
    ServiceTokens.PLATFORM_SERVICE_FACTORY,
  );
}

export async function getPlatformSyncService(): Promise<PlatformSyncService> {
  await ensureBootstrapped();

  return container.resolve<PlatformSyncService>(
    ServiceTokens.PLATFORM_SYNC_SERVICE,
  );
}

export async function getPlatformDatabaseService(): Promise<PlatformDatabaseService> {
  await ensureBootstrapped();

  return container.resolve<PlatformDatabaseService>(
    ServiceTokens.PLATFORM_DATABASE_SERVICE,
  );
}

export async function getAdService(): Promise<AdService> {
  await ensureBootstrapped();

  return container.resolve<AdService>(ServiceTokens.AD_SERVICE);
}

export async function getGoogleAdsIntegrationService(): Promise<GoogleAdsIntegrationService> {
  await ensureBootstrapped();

  return container.resolve<GoogleAdsIntegrationService>(
    ServiceTokens.GOOGLE_ADS_INTEGRATION_SERVICE,
  );
}


export async function getRedisClient(): Promise<RedisClient> {
  await ensureBootstrapped();

  return container.resolve<RedisClient>(ServiceTokens.REDIS_CLIENT);
}

// 일반적인 서비스 getter (타입을 직접 지정해야 함)
export async function getService<T>(token: symbol): Promise<T> {
  await ensureBootstrapped();

  return container.resolve<T>(token);
}
