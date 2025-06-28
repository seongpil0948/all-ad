import { PlatformServiceFactory } from "./platform-service-factory";
import { GoogleAdsPlatformService } from "./google-ads-platform.service";
// import { MetaAdsPlatformService } from "./meta-ads-platform.service";
// import { NaverAdsPlatformService } from "./naver-ads-platform.service";
// import { KakaoAdsPlatformService } from "./kakao-ads-platform.service";
// import { CoupangAdsPlatformService } from "./coupang-ads-platform.service";

// 싱글톤 인스턴스
let platformServiceFactory: PlatformServiceFactory | null = null;

export function getPlatformServiceFactory(): PlatformServiceFactory {
  if (!platformServiceFactory) {
    platformServiceFactory = new PlatformServiceFactory();

    // 각 플랫폼 서비스 등록
    platformServiceFactory.register("google", new GoogleAdsPlatformService());
    // platformServiceFactory.register("META", new MetaAdsPlatformService());
    // platformServiceFactory.register("NAVER", new NaverAdsPlatformService());
    // platformServiceFactory.register("KAKAO", new KakaoAdsPlatformService());
    // platformServiceFactory.register("COUPANG", new CoupangAdsPlatformService());
  }

  return platformServiceFactory;
}

export { PlatformServiceFactory } from "./platform-service-factory";
export { GoogleAdsPlatformService } from "./google-ads-platform.service";
export type { PlatformService } from "./platform-service.interface";
