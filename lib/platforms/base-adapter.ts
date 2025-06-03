// Base adapter class for all platform integrations

import {
  PlatformAdapter,
  PlatformConnection,
  PlatformType,
  SyncResult,
  AdAccount,
  Campaign,
} from "@/types";
import logger from "@/utils/logger";

export abstract class BasePlatformAdapter implements PlatformAdapter {
  abstract type: PlatformType;

  constructor() {
    logger.info(`Initializing ${this.constructor.name}`);
  }

  abstract connect(credentials: any): Promise<PlatformConnection>;
  abstract disconnect(connectionId: string): Promise<void>;
  abstract syncData(connectionId: string): Promise<SyncResult>;
  abstract getAccounts(connectionId: string): Promise<AdAccount[]>;
  abstract getCampaigns(accountId: string): Promise<Campaign[]>;

  // Common utility methods
  protected async handleApiError(error: any): Promise<never> {
    logger.error(`API Error in ${this.constructor.name}:`, error);

    if (error.response) {
      // API responded with error
      throw new Error(
        `API Error: ${error.response.status} - ${error.response.data.message || "Unknown error"}`,
      );
    } else if (error.request) {
      // Request made but no response
      throw new Error("Network error: No response from API");
    } else {
      // Something else happened
      throw new Error(`Error: ${error.message || "Unknown error"}`);
    }
  }

  protected validateConnection(connection: PlatformConnection): void {
    if (!connection.id || !connection.accountId) {
      throw new Error("Invalid connection: Missing required fields");
    }

    if (connection.expiresAt && new Date(connection.expiresAt) < new Date()) {
      throw new Error("Connection expired");
    }
  }

  // Rate limiting helper
  protected async rateLimitedRequest<T>(
    request: () => Promise<T>,
    retries = 3,
    delay = 1000,
  ): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        return await request();
      } catch (error: any) {
        if (error.response?.status === 429 && i < retries - 1) {
          // Rate limited, wait and retry
          logger.warn(`Rate limited, retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        } else {
          throw error;
        }
      }
    }
    throw new Error("Max retries exceeded");
  }
}
