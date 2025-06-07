// Type conversion utilities between database and application layers
import {
  Campaign as DbCampaign,
  PlatformCredential as DbPlatformCredential,
} from "./database.types";
import { CredentialValues } from "./credentials.types";

import {
  Campaign,
  PlatformCredential,
  CampaignStatus,
  CampaignMetrics,
} from "./index";

// Convert snake_case to camelCase
export function toCamelCase<T extends Record<string, unknown>>(
  obj: T,
): unknown {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }

  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  return Object.keys(obj).reduce(
    (acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
        letter.toUpperCase(),
      );

      const value = obj[key];

      acc[camelKey] =
        value && typeof value === "object" && !Array.isArray(value)
          ? toCamelCase(value as Record<string, unknown>)
          : Array.isArray(value)
            ? value.map((item) =>
                typeof item === "object" && item !== null
                  ? toCamelCase(item as Record<string, unknown>)
                  : item,
              )
            : value;

      return acc;
    },
    {} as Record<string, unknown>,
  );
}

// Convert camelCase to snake_case
export function toSnakeCase<T extends Record<string, unknown>>(
  obj: T,
): unknown {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }

  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  return Object.keys(obj).reduce(
    (acc, key) => {
      const snakeKey = key.replace(
        /[A-Z]/g,
        (letter) => `_${letter.toLowerCase()}`,
      );

      const value = obj[key];

      acc[snakeKey] =
        value && typeof value === "object" && !Array.isArray(value)
          ? toSnakeCase(value as Record<string, unknown>)
          : Array.isArray(value)
            ? value.map((item) =>
                typeof item === "object" && item !== null
                  ? toSnakeCase(item as Record<string, unknown>)
                  : item,
              )
            : value;

      return acc;
    },
    {} as Record<string, unknown>,
  );
}

// Convert database campaign to application campaign
export function dbCampaignToAppCampaign(dbCampaign: DbCampaign): Campaign {
  return {
    id: dbCampaign.id,
    teamId: dbCampaign.team_id,
    platform: dbCampaign.platform,
    platformCampaignId: dbCampaign.platform_campaign_id,
    name: dbCampaign.name,
    status: (dbCampaign.status as CampaignStatus) || "paused",
    budget: dbCampaign.budget || undefined,
    isActive: dbCampaign.is_active,
    createdAt: dbCampaign.created_at,
    updatedAt: dbCampaign.updated_at,
    metrics: dbCampaign.raw_data
      ? (toCamelCase(dbCampaign.raw_data) as unknown as CampaignMetrics)
      : undefined,
  };
}

// Convert application campaign to database campaign
export function appCampaignToDbCampaign(
  appCampaign: Partial<Campaign>,
): Partial<DbCampaign> {
  return {
    id: appCampaign.id,
    team_id: appCampaign.teamId,
    platform: appCampaign.platform,
    platform_campaign_id: appCampaign.platformCampaignId,
    name: appCampaign.name,
    status: appCampaign.status,
    budget: appCampaign.budget,
    is_active: appCampaign.isActive,
    raw_data: appCampaign.metrics
      ? (toSnakeCase(
          appCampaign.metrics as unknown as Record<string, unknown>,
        ) as unknown as Record<string, unknown>)
      : undefined,
  };
}

// Convert database credential to application credential
export function dbCredentialToAppCredential(
  dbCred: DbPlatformCredential,
): PlatformCredential {
  return {
    id: dbCred.id,
    teamId: dbCred.team_id,
    platform: dbCred.platform,
    credentials: dbCred.credentials as CredentialValues,
    isActive: dbCred.is_active,
    createdAt: dbCred.created_at,
    updatedAt: dbCred.updated_at,
    lastSyncAt: dbCred.last_sync_at,
  };
}

// Convert application credential to database credential
export function appCredentialToDbCredential(
  appCred: Partial<PlatformCredential>,
): Partial<DbPlatformCredential> {
  return {
    id: appCred.id,
    team_id: appCred.teamId,
    platform: appCred.platform,
    credentials: appCred.credentials,
    is_active: appCred.isActive,
    last_sync_at: appCred.lastSyncAt,
  };
}
