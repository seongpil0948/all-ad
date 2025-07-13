import {
  Campaign,
  CampaignMetrics,
  CampaignWithMetrics,
  PlatformType,
} from "@/types";

// Token refresh result
export interface TokenRefreshResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  error?: string;
}

// Platform connection test result
export interface ConnectionTestResult {
  success: boolean;
  accountInfo?: {
    id: string;
    name: string;
    currency?: string;
    timezone?: string;
  };
  error?: string;
}

// Platform credentials interface
export interface PlatformCredentials {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  accountId?: string;
  customerId?: string;
  additionalData?: Record<string, unknown>;
  [key: string]: unknown; // Allow additional properties
}

// Enhanced platform service interface
export interface PlatformService {
  platform: PlatformType;

  // Set credentials for the service
  setCredentials(credentials: PlatformCredentials): void;

  // Set multi-account credentials (MCC, System User, Business Center)
  setMultiAccountCredentials?(credentials: Record<string, unknown>): void;

  // Test connection to the platform
  testConnection(): Promise<ConnectionTestResult>;

  // Validate and refresh credentials if needed
  validateCredentials(): Promise<boolean>;

  // Refresh access token
  refreshToken(): Promise<TokenRefreshResult>;

  // Fetch campaigns from the platform
  fetchCampaigns(): Promise<Campaign[] | CampaignWithMetrics[]>;

  // Fetch campaign metrics
  fetchCampaignMetrics(
    campaignId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CampaignMetrics[]>;

  // Update campaign budget
  updateCampaignBudget(campaignId: string, budget: number): Promise<boolean>;

  // Update campaign status (active/paused)
  updateCampaignStatus(campaignId: string, isActive: boolean): Promise<boolean>;

  // Get account information
  getAccountInfo(): Promise<{
    id: string;
    name: string;
    currency?: string;
    timezone?: string;
  }>;

  // Clean up resources
  cleanup?(): Promise<void>;
}

// Platform integration service interface
export interface PlatformIntegrationService {
  platform: PlatformType;

  // Initialize the service with credentials
  initialize(credentials: PlatformCredentials): Promise<void>;

  // Test connection and validate setup
  validateConnection(): Promise<boolean>;

  // Sync campaigns from platform
  syncCampaigns(): Promise<Campaign[]>;

  // Refresh tokens if needed
  refreshTokens(): Promise<boolean>;

  // Get real-time metrics
  getMetrics(dateRange?: string): Promise<CampaignMetrics[]>;

  // Cleanup resources
  cleanup(): Promise<void>;
}

// Platform service factory
export interface PlatformServiceFactory {
  createService(platform: PlatformType): PlatformService;
  createIntegrationService(platform: PlatformType): PlatformIntegrationService;
}
