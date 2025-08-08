// Common utility functions for platform services
import type { PlatformCredential, PlatformType } from "@/types";
import type {
  ExtendedPlatformCredentials,
  PlatformMetricsData,
  RetryConfig,
} from "@/types/platform-common.types";
import type { CampaignMetrics } from "@/types/campaign.types";
import type { Json } from "@/types/supabase.types";

import { DEFAULT_RETRY_CONFIG } from "@/types/platform-common.types";

/**
 * Convert PlatformCredentials to PlatformCredential format
 */
export function convertCredentialsFormat(
  credentials: Record<string, unknown>,
  platform: string,
  additionalData?: Record<string, unknown>,
): PlatformCredential {
  const extendedCreds = credentials as ExtendedPlatformCredentials;

  const expiresAtValue = credentials.expiresAt || credentials.expires_at;
  const expiresAtString = expiresAtValue
    ? typeof expiresAtValue === "string"
      ? expiresAtValue
      : (expiresAtValue as Date).toISOString()
    : null;

  return {
    id: String(extendedCreds.id || ""),
    team_id: String(extendedCreds.teamId || ""),
    platform: platform as PlatformType,
    account_id: String(credentials.accountId || credentials.account_id || ""),
    account_name: extendedCreds.accountName || null,
    access_token: String(
      credentials.accessToken || credentials.access_token || "",
    ),
    refresh_token: String(
      credentials.refreshToken || credentials.refresh_token || "",
    ),
    expires_at: expiresAtString,
    scope: String(credentials.scope || ""),
    is_active: true,
    credentials: {},
    data: sanitizeForJson({
      ...(typeof credentials.additionalData === "object" &&
      credentials.additionalData !== null
        ? (credentials.additionalData as Record<string, unknown>)
        : {}),
      ...additionalData,
    }),
    error_message: null,
    last_synced_at: null,
    created_at: new Date().toISOString(),
    created_by: "",
    updated_at: new Date().toISOString(),
  };
}

/**
 * Parse numeric value from string or number
 */
export function parseNumericValue(
  value: string | number | undefined | null,
  defaultValue = 0,
): number {
  if (value === undefined || value === null) return defaultValue;

  const parsed = typeof value === "string" ? parseFloat(value) : value;

  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parse integer value from string or number
 */
export function parseIntValue(
  value: string | number | undefined | null,
  defaultValue = 0,
): number {
  if (value === undefined || value === null) return defaultValue;

  const parsed =
    typeof value === "string" ? parseInt(value, 10) : Math.floor(value);

  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Transform platform metrics to common format
 */
export function transformMetricsToCommon(
  metrics: PlatformMetricsData,
  campaignId: string,
): Partial<CampaignMetrics> & { date: string; campaign_id: string } {
  return {
    campaign_id: campaignId,
    date: metrics.date,
    impressions: metrics.impressions,
    clicks: metrics.clicks,
    cost: metrics.cost,
    conversions: metrics.conversions || 0,
    ctr: metrics.ctr,
    cpc: metrics.cpc,
    cpm: metrics.cpm,
    roas: metrics.roas,
    raw_data: sanitizeForJson(metrics) as Record<string, unknown>,
    created_at: new Date().toISOString(),
  };
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDateToYYYYMMDD(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Calculate token expiry date
 */
export function calculateTokenExpiry(expiresIn: number): Date {
  const expiryDate = new Date();

  expiryDate.setSeconds(expiryDate.getSeconds() + expiresIn);

  return expiryDate;
}

/**
 * Check if token is expired
 */
export function isTokenExpired(
  expiresAt: string | Date | null | undefined,
): boolean {
  if (!expiresAt) return true;

  const expiryDate =
    typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;

  return new Date() >= expiryDate;
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
): Promise<T> {
  let lastError: Error | unknown;
  let delay = config.initialDelay;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === config.maxRetries) {
        break;
      }

      // Calculate next delay with exponential backoff
      await sleep(delay);
      delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
    }
  }

  throw lastError;
}

/**
 * Batch array into chunks
 */
export function batchArray<T>(array: T[], batchSize: number): T[][] {
  const batches: T[][] = [];

  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }

  return batches;
}

/**
 * Validate required environment variables
 */
export function validateEnvVars(
  platform: string,
  requiredVars: string[],
): void {
  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables for ${platform}: ${missingVars.join(", ")}`,
    );
  }
}

/**
 * Sanitize object for JSON storage
 */
export function sanitizeForJson(obj: unknown): Json {
  if (obj === null || obj === undefined) return null;

  if (
    typeof obj === "string" ||
    typeof obj === "number" ||
    typeof obj === "boolean"
  ) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeForJson);
  }

  if (typeof obj === "object") {
    const sanitized: { [key: string]: Json } = {};

    for (const [key, value] of Object.entries(obj)) {
      // Skip functions and undefined values
      if (typeof value !== "function" && value !== undefined) {
        sanitized[key] = sanitizeForJson(value);
      }
    }

    return sanitized;
  }

  // For any other type, convert to string
  return String(obj);
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  ...sources: Array<Partial<Record<string, unknown>>>
): T {
  if (!sources.length) return target;

  const source = sources.shift();
  const result = { ...target };

  if (source && typeof source === "object") {
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const sourceValue = source[key];
        const targetValue = result[key];

        if (
          sourceValue &&
          typeof sourceValue === "object" &&
          !Array.isArray(sourceValue) &&
          targetValue &&
          typeof targetValue === "object" &&
          !Array.isArray(targetValue)
        ) {
          (result as Record<string, unknown>)[key] = deepMerge(
            { ...targetValue } as Record<string, unknown>,
            sourceValue as Record<string, unknown>,
          );
        } else if (sourceValue !== undefined) {
          (result as Record<string, unknown>)[key] = sourceValue;
        }
      }
    }
  }

  return deepMerge(result, ...sources);
}
