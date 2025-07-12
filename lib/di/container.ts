// 의존성 주입 컨테이너

interface ServiceFactory<T> {
  (): T | Promise<T>;
}

interface ServiceDescriptor<T> {
  factory: ServiceFactory<T>;
  singleton: boolean;
  instance?: T;
}

export class DIContainer {
  private services = new Map<symbol, ServiceDescriptor<unknown>>();

  register<T>(token: symbol, factory: ServiceFactory<T>): void {
    this.services.set(token, {
      factory,
      singleton: false,
    });
  }

  registerSingleton<T>(token: symbol, factory: ServiceFactory<T>): void {
    this.services.set(token, {
      factory,
      singleton: true,
    });
  }

  async resolve<T>(token: symbol): Promise<T> {
    const descriptor = this.services.get(token);

    if (!descriptor) {
      throw new Error(`Service not found: ${token.toString()}`);
    }

    if (descriptor.singleton) {
      if (!descriptor.instance) {
        descriptor.instance = await descriptor.factory();
      }

      return descriptor.instance as T;
    }

    return (await descriptor.factory()) as T;
  }
}

// 글로벌 컨테이너 인스턴스
export const container = new DIContainer();

// 서비스 토큰
export const ServiceTokens = {
  // Infrastructure
  REDIS_CLIENT: Symbol("REDIS_CLIENT"),
  SUPABASE_CLIENT: Symbol("SUPABASE_CLIENT"),

  // Platform Services
  GOOGLE_PLATFORM_SERVICE: Symbol("GOOGLE_PLATFORM_SERVICE"),
  FACEBOOK_PLATFORM_SERVICE: Symbol("FACEBOOK_PLATFORM_SERVICE"),
  NAVER_PLATFORM_SERVICE: Symbol("NAVER_PLATFORM_SERVICE"),
  KAKAO_PLATFORM_SERVICE: Symbol("KAKAO_PLATFORM_SERVICE"),
  COUPANG_PLATFORM_SERVICE: Symbol("COUPANG_PLATFORM_SERVICE"),
  AMAZON_PLATFORM_SERVICE: Symbol("AMAZON_PLATFORM_SERVICE"),

  // Core Services
  PLATFORM_SERVICE_FACTORY: Symbol("PLATFORM_SERVICE_FACTORY"),
  PLATFORM_DATABASE_SERVICE: Symbol("PLATFORM_DATABASE_SERVICE"),
  PLATFORM_SYNC_SERVICE: Symbol("PLATFORM_SYNC_SERVICE"),
  AD_SERVICE: Symbol("AD_SERVICE"),

  // Google Ads Services
  GOOGLE_ADS_CLIENT: Symbol("GOOGLE_ADS_CLIENT"),
  CAMPAIGN_CONTROL_SERVICE: Symbol("CAMPAIGN_CONTROL_SERVICE"),
  LABEL_MANAGEMENT_SERVICE: Symbol("LABEL_MANAGEMENT_SERVICE"),
  GOOGLE_ADS_SYNC_SERVICE: Symbol("GOOGLE_ADS_SYNC_SERVICE"),
  GOOGLE_ADS_INTEGRATION_SERVICE: Symbol("GOOGLE_ADS_INTEGRATION_SERVICE"),
} as const;
