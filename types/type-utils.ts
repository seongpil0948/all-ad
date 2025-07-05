// Type conversion utilities between database and application layers

import type { Database } from "./supabase.types";

import { Campaign, PlatformCredential, CampaignStatus } from "./index";

// Database types from Supabase (raw database row types)
type DbCampaign = Database["public"]["Tables"]["campaigns"]["Row"];
type DbPlatformCredential =
  Database["public"]["Tables"]["platform_credentials"]["Row"];

export type NonNullable<T> = T extends null | undefined ? never : T;
export type Concrete<Type> = {
  [Key in keyof Type]-?: NonNullable<Type[Key]>;
};
export type PromiseType<T> = T extends Promise<infer U> ? U : never;
export type PromiseReturnType<
  T extends (...args: unknown[]) => Promise<unknown>,
> = PromiseType<ReturnType<T>>;
export type ToSearchState<T> = {
  [K in keyof T]: T[K] extends string ? T[K] | "ALL" : T[K];
};

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
    team_id: dbCampaign.team_id,
    platform: dbCampaign.platform,
    platform_campaign_id: dbCampaign.platform_campaign_id,
    name: dbCampaign.name,
    status: (dbCampaign.status as CampaignStatus) || "paused",
    budget: dbCampaign.budget || undefined,
    is_active: dbCampaign.is_active,
    created_at: dbCampaign.created_at,
    updated_at: dbCampaign.updated_at,
    raw_data: dbCampaign.raw_data,
  };
}

// Convert application campaign to database campaign
export function appCampaignToDbCampaign(
  appCampaign: Partial<Campaign>,
): Partial<DbCampaign> {
  return {
    id: appCampaign.id,
    team_id: appCampaign.team_id,
    platform: appCampaign.platform,
    platform_campaign_id: appCampaign.platform_campaign_id,
    name: appCampaign.name,
    status: appCampaign.status,
    budget: appCampaign.budget,
    is_active: appCampaign.is_active,
    raw_data: appCampaign.raw_data,
  };
}

// Convert database credential to application credential
export function dbCredentialToAppCredential(
  dbCred: DbPlatformCredential,
): PlatformCredential {
  return {
    id: dbCred.id,
    team_id: dbCred.team_id,
    platform: dbCred.platform,
    account_id: dbCred.account_id,
    account_name: dbCred.account_name,
    credentials: dbCred.credentials,
    data: dbCred.data,
    access_token: dbCred.access_token,
    refresh_token: dbCred.refresh_token,
    expires_at: dbCred.expires_at,
    scope: dbCred.scope,
    is_active: dbCred.is_active,
    created_by: dbCred.created_by,
    last_synced_at: dbCred.last_synced_at,
    created_at: dbCred.created_at,
    updated_at: dbCred.updated_at,
  };
}

// Convert application credential to database credential
export function appCredentialToDbCredential(
  appCred: Partial<PlatformCredential>,
): Partial<DbPlatformCredential> {
  return {
    id: appCred.id,
    team_id: appCred.team_id,
    platform: appCred.platform,
    account_id: appCred.account_id,
    account_name: appCred.account_name,
    credentials: appCred.credentials,
    data: appCred.data,
    access_token: appCred.access_token,
    refresh_token: appCred.refresh_token,
    expires_at: appCred.expires_at,
    scope: appCred.scope,
    is_active: appCred.is_active,
    created_by: appCred.created_by || undefined,
    last_synced_at: appCred.last_synced_at,
  };
}
