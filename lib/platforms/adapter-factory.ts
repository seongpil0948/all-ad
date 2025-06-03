// Platform adapter factory for creating appropriate adapters

import { GoogleAdsAdapter } from "./google-ads-adapter";
import { MetaAdsAdapter } from "./meta-ads-adapter";
import { CoupangAdsAdapter } from "./coupang-ads-adapter";

import { PlatformType, PlatformAdapter } from "@/types";
import log from "@/utils/logger";

export class PlatformAdapterFactory {
  private static adapters: Map<PlatformType, PlatformAdapter> = new Map();

  static getAdapter(type: PlatformType): PlatformAdapter {
    // Check if adapter already exists (singleton pattern)
    if (this.adapters.has(type)) {
      return this.adapters.get(type)!;
    }

    let adapter: PlatformAdapter;

    switch (type) {
      case "google":
        adapter = new GoogleAdsAdapter();
        break;
      case "facebook":
        adapter = new MetaAdsAdapter();
        break;
      case "coupang":
        adapter = new CoupangAdsAdapter();
        break;
      default:
        log.error(`Unsupported platform type: ${type}`);
        throw new Error(`Platform ${type} is not supported`);
    }

    // Store adapter instance
    this.adapters.set(type, adapter);

    log.info(`Created adapter for platform: ${type}`);

    return adapter;
  }

  static getSupportedPlatforms(): PlatformType[] {
    return ["google", "facebook", "coupang"];
  }

  static isPlatformSupported(type: string): boolean {
    return this.getSupportedPlatforms().includes(type as PlatformType);
  }
}
