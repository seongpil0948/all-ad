import {
  PlatformService,
  PlatformCredentials,
  ConnectionTestResult,
  TokenRefreshResult,
  PlatformIntegrationService,
  PlatformServiceFactory,
} from "./platform-service.interface";

import { Campaign, CampaignMetrics, PlatformType } from "@/types";
import {
  PlatformError,
  PlatformErrorHandler,
  PlatformConfigError,
} from "@/types/platform-errors.types";
import { formatDateToYYYYMMDD } from "@/utils/date-formatter";
import log from "@/utils/logger";

export abstract class BasePlatformService<TService = unknown>
  implements PlatformService
{
  abstract platform: PlatformType;
  protected credentials: PlatformCredentials | null = null;
  protected teamId?: string;
  protected service?: TService; // Platform-specific service instance
  protected isInitialized = false;

  constructor(credentials?: PlatformCredentials) {
    if (credentials) {
      this.setCredentials(credentials);
    }
  }

  setCredentials(credentials: PlatformCredentials): void {
    this.credentials = credentials;
    this.service = undefined; // Reset service when credentials change
    this.isInitialized = true;
    log.info(`${this.platform} credentials set`);
  }

  setMultiAccountCredentials?(credentials: Record<string, unknown>): void {
    if (this.credentials) {
      this.credentials.additionalData = {
        ...this.credentials.additionalData,
        ...credentials,
      };
    }
  }

  // Set team ID for platforms that need it
  setTeamId(teamId: string): void {
    this.teamId = teamId;
  }

  protected ensureInitialized(): void {
    if (!this.isInitialized || !this.credentials) {
      throw new PlatformConfigError(
        this.platform,
        `${this.platform} service not initialized with credentials`,
      );
    }
  }

  protected async handleError<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const platformError = PlatformErrorHandler.parseError(
        this.platform,
        error,
      );

      log.error(`${this.platform} operation failed`, {
        error: platformError.message,
        code: platformError.code,
        retryable: platformError.retryable,
      });
      throw platformError;
    }
  }

  protected async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
  ): Promise<T> {
    let lastError: PlatformError | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.handleError(operation);
      } catch (error) {
        lastError = error as PlatformError;

        if (
          !PlatformErrorHandler.isRetryable(lastError) ||
          attempt === maxRetries
        ) {
          throw lastError;
        }

        const delay = PlatformErrorHandler.getRetryDelay(lastError);

        log.warn(`${this.platform} operation failed, retrying in ${delay}ms`, {
          attempt,
          maxRetries,
          error: lastError.code,
        });

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  protected getCredentialValue(key: keyof PlatformCredentials): string {
    this.ensureInitialized();
    const value = this.credentials![key];

    if (typeof value === "string") {
      return value;
    }
    throw new PlatformConfigError(
      this.platform,
      `Missing or invalid credential: ${key}`,
    );
  }

  // Common helper methods
  protected formatDate(date: Date): string {
    return formatDateToYYYYMMDD(date);
  }

  protected parseMetricsResponse(
    data: Partial<CampaignMetrics>,
  ): CampaignMetrics {
    // Default implementation - can be overridden by specific platforms
    return {
      impressions: 0,
      clicks: 0,
      cost: 0,
      conversions: 0,
      revenue: 0,
      ctr: 0,
      cpc: 0,
      cpm: 0,
      roas: 0,
      roi: 0,
      date: new Date().toISOString().split("T")[0],
      ...data,
    };
  }

  // Enhanced error handling wrapper
  protected async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    operationName: string,
  ): Promise<T> {
    try {
      log.info(`${this.platform}: Starting ${operationName}`);
      const result = await this.retryOperation(operation);

      log.info(`${this.platform}: Completed ${operationName}`);

      return result;
    } catch (error) {
      const platformError = error as PlatformError;

      log.error(`${this.platform}: Failed ${operationName}`, {
        error: platformError.message,
        code: platformError.code,
        userMessage: platformError.userMessage,
      });
      throw platformError;
    }
  }

  // Enhanced validation for credentials
  protected validateRequiredFields(
    requiredFields: (keyof PlatformCredentials)[],
    credentials: PlatformCredentials = this.credentials!,
  ): boolean {
    if (!credentials) {
      log.warn(`${this.platform}: No credentials provided`);

      return false;
    }

    for (const field of requiredFields) {
      if (!credentials[field]) {
        log.warn(
          `${this.platform}: Missing required credential field: ${String(field)}`,
        );

        return false;
      }
    }

    return true;
  }

  // Abstract methods that must be implemented by subclasses
  abstract testConnection(): Promise<ConnectionTestResult>;
  abstract validateCredentials(): Promise<boolean>;
  abstract refreshToken(): Promise<TokenRefreshResult>;
  abstract fetchCampaigns(): Promise<Campaign[]>;
  abstract fetchCampaignMetrics(
    campaignId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CampaignMetrics[]>;
  abstract updateCampaignBudget(
    campaignId: string,
    budget: number,
  ): Promise<boolean>;
  abstract updateCampaignStatus(
    campaignId: string,
    isActive: boolean,
  ): Promise<boolean>;
  abstract getAccountInfo(): Promise<{
    id: string;
    name: string;
    currency?: string;
    timezone?: string;
  }>;

  // Optional cleanup method
  async cleanup?(): Promise<void> {
    this.service = undefined;
    log.info(`${this.platform} service cleanup completed`);
  }
}

// Base integration service for unified platform integration
export abstract class BasePlatformIntegrationService
  implements PlatformIntegrationService
{
  abstract platform: PlatformType;
  protected credentials: PlatformCredentials | null = null;
  protected isInitialized = false;

  constructor() {
    // Platform will be set by subclass
  }

  async initialize(credentials: PlatformCredentials): Promise<void> {
    this.credentials = credentials;
    this.isInitialized = true;
    log.info(`${this.platform} integration service initialized`);
  }

  protected ensureInitialized(): void {
    if (!this.isInitialized || !this.credentials) {
      throw new PlatformConfigError(
        this.platform,
        `${this.platform} integration service not initialized`,
      );
    }
  }

  protected async handleError<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const platformError = PlatformErrorHandler.parseError(
        this.platform,
        error,
      );

      log.error(`${this.platform} integration operation failed`, {
        error: platformError.message,
        code: platformError.code,
      });
      throw platformError;
    }
  }

  // Abstract methods for integration service
  abstract validateConnection(): Promise<boolean>;
  abstract syncCampaigns(): Promise<Campaign[]>;
  abstract refreshTokens(): Promise<boolean>;
  abstract getMetrics(dateRange?: string): Promise<CampaignMetrics[]>;
  abstract cleanup(): Promise<void>;
}

// Enhanced factory for both platform service and integration service
export abstract class BasePlatformServiceFactory
  implements PlatformServiceFactory
{
  abstract createService(platform: PlatformType): PlatformService;
  abstract createIntegrationService(
    platform: PlatformType,
  ): PlatformIntegrationService;

  // Helper method to validate platform support
  protected validatePlatformSupport(platform: PlatformType): void {
    const supportedPlatforms = ["google", "facebook", "amazon"] as const;

    if (
      !supportedPlatforms.includes(
        platform as (typeof supportedPlatforms)[number],
      )
    ) {
      throw new PlatformConfigError(
        platform,
        `Platform ${platform} is not supported`,
      );
    }
  }
}
