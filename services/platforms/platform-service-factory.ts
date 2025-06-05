import {
  PlatformService,
  PlatformServiceFactory as IPlatformServiceFactory,
} from "./platform-service.interface";

import { PlatformType } from "@/types";

export class PlatformServiceFactory implements IPlatformServiceFactory {
  private services: Map<PlatformType, PlatformService>;

  constructor() {
    this.services = new Map();
  }

  register(platform: PlatformType, service: PlatformService): void {
    this.services.set(platform, service);
  }

  createService(platform: PlatformType): PlatformService {
    const service = this.services.get(platform);

    if (!service) {
      throw new Error(`Platform service not found for: ${platform}`);
    }

    return service;
  }

  getAvailablePlatforms(): PlatformType[] {
    return Array.from(this.services.keys());
  }
}
