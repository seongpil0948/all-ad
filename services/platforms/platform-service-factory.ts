import {
  PlatformService,
  PlatformServiceFactory,
} from "./platform-service.interface";
import { FacebookPlatformService } from "./facebook-platform.service";
import { GooglePlatformService } from "./google-platform.service";
import { KakaoPlatformService } from "./kakao-platform.service";
import { NaverPlatformService } from "./naver-platform.service";
import { CoupangPlatformService } from "./coupang-platform.service";

import { PlatformType } from "@/types";

export class PlatformServiceFactoryImpl implements PlatformServiceFactory {
  private static instance: PlatformServiceFactoryImpl;
  private services: Map<PlatformType, PlatformService>;

  private constructor() {
    this.services = new Map();
    this.registerServices();
  }

  static getInstance(): PlatformServiceFactoryImpl {
    if (!PlatformServiceFactoryImpl.instance) {
      PlatformServiceFactoryImpl.instance = new PlatformServiceFactoryImpl();
    }

    return PlatformServiceFactoryImpl.instance;
  }

  private registerServices(): void {
    this.services.set(
      "facebook" as PlatformType,
      new FacebookPlatformService(),
    );
    this.services.set("google" as PlatformType, new GooglePlatformService());
    this.services.set("kakao" as PlatformType, new KakaoPlatformService());
    this.services.set("naver" as PlatformType, new NaverPlatformService());
    this.services.set("coupang" as PlatformType, new CoupangPlatformService());
  }

  createService(platform: PlatformType): PlatformService {
    const service = this.services.get(platform);

    if (!service) {
      throw new Error(`Platform service not found for: ${platform}`);
    }

    return service;
  }
}

// Export singleton instance
export const platformServiceFactory = PlatformServiceFactoryImpl.getInstance();
