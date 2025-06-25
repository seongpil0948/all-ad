import { cache } from "react";
import "server-only";

import { createClient } from "@/utils/supabase/server";
import { PlatformType } from "@/types";
import log from "@/utils/logger";

// Platform credential types
export interface PlatformCredential {
  id: string;
  team_id: string;
  platform: PlatformType;
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  scope?: string;
  account_id: string;
  account_name?: string;
  is_active: boolean;
  last_sync_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface TokenRefreshResult {
  success: boolean;
  access_token?: string;
  refresh_token?: string;
  expires_at?: string;
  error?: string;
}

// Cache platform credentials to prevent duplicate queries
export const getPlatformCredentials = cache(
  async (teamId: string, platform?: PlatformType) => {
    const supabase = await createClient();

    try {
      let query = supabase
        .from("platform_credentials")
        .select("*")
        .eq("team_id", teamId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (platform) {
        query = query.eq("platform", platform);
      }

      const { data, error } = await query;

      if (error) {
        log.error("Failed to fetch platform credentials", error);
        throw error;
      }

      return data as PlatformCredential[];
    } catch (error) {
      log.error("Error in getPlatformCredentials", error);
      throw error;
    }
  },
);

// Cache single platform credential
export const getPlatformCredential = cache(
  async (teamId: string, platform: PlatformType, accountId?: string) => {
    const supabase = await createClient();

    try {
      let query = supabase
        .from("platform_credentials")
        .select("*")
        .eq("team_id", teamId)
        .eq("platform", platform)
        .eq("is_active", true);

      if (accountId) {
        query = query.eq("account_id", accountId);
      }

      const { data, error } = await query.single();

      if (error && error.code !== "PGRST116") {
        log.error("Failed to fetch platform credential", error);
        throw error;
      }

      return data as PlatformCredential | null;
    } catch (error) {
      log.error("Error in getPlatformCredential", error);
      throw error;
    }
  },
);

// Check if credentials are expired
export function isCredentialExpired(credential: PlatformCredential): boolean {
  if (!credential.expires_at) return false;

  return new Date(credential.expires_at) <= new Date();
}

// Check if credentials need refresh (within 5 minutes of expiry)
export function needsRefresh(credential: PlatformCredential): boolean {
  if (!credential.expires_at) return false;
  const expiryTime = new Date(credential.expires_at);
  const now = new Date();
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  return expiryTime <= fiveMinutesFromNow;
}

// Store or update platform credentials
export async function storePlatformCredential(
  teamId: string,
  platform: PlatformType,
  data: {
    access_token: string;
    refresh_token?: string;
    expires_at?: string;
    scope?: string;
    account_id: string;
    account_name?: string;
  },
): Promise<PlatformCredential> {
  const supabase = await createClient();

  try {
    // First, deactivate any existing credentials for this platform/account
    await supabase
      .from("platform_credentials")
      .update({ is_active: false })
      .eq("team_id", teamId)
      .eq("platform", platform)
      .eq("account_id", data.account_id);

    // Insert new credential
    const { data: credential, error } = await supabase
      .from("platform_credentials")
      .insert({
        team_id: teamId,
        platform,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
        scope: data.scope,
        account_id: data.account_id,
        account_name: data.account_name,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      log.error("Failed to store platform credential", error);
      throw error;
    }

    log.info("Platform credential stored successfully", {
      teamId,
      platform,
      accountId: data.account_id,
    });

    return credential;
  } catch (error) {
    log.error("Error in storePlatformCredential", error);
    throw error;
  }
}

// Update platform credential tokens
export async function updatePlatformTokens(
  credentialId: string,
  tokens: {
    access_token: string;
    refresh_token?: string;
    expires_at?: string;
  },
): Promise<void> {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("platform_credentials")
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expires_at,
        error_message: null, // Clear any previous errors
        updated_at: new Date().toISOString(),
      })
      .eq("id", credentialId);

    if (error) {
      log.error("Failed to update platform tokens", error);
      throw error;
    }

    log.info("Platform tokens updated successfully", { credentialId });
  } catch (error) {
    log.error("Error in updatePlatformTokens", error);
    throw error;
  }
}

// Mark credential as failed
export async function markCredentialFailed(
  credentialId: string,
  errorMessage: string,
): Promise<void> {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("platform_credentials")
      .update({
        error_message: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", credentialId);

    if (error) {
      log.error("Failed to mark credential as failed", error);
      throw error;
    }

    log.warn("Platform credential marked as failed", {
      credentialId,
      errorMessage,
    });
  } catch (error) {
    log.error("Error in markCredentialFailed", error);
    throw error;
  }
}

// Update last sync time
export async function updateLastSync(credentialId: string): Promise<void> {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("platform_credentials")
      .update({
        last_sync_at: new Date().toISOString(),
        error_message: null, // Clear any previous errors
        updated_at: new Date().toISOString(),
      })
      .eq("id", credentialId);

    if (error) {
      log.error("Failed to update last sync time", error);
      throw error;
    }

    log.info("Last sync time updated", { credentialId });
  } catch (error) {
    log.error("Error in updateLastSync", error);
    throw error;
  }
}

// Get credentials that need token refresh
export async function getCredentialsNeedingRefresh(): Promise<
  Array<PlatformCredential & { credentials: Record<string, unknown> }>
> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("platform_credentials")
      .select("*, credentials")
      .eq("is_active", true)
      .not("credentials->refresh_token", "is", null)
      .not("credentials->expires_at", "is", null)
      .lt(
        "credentials->expires_at",
        new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      ); // Expires within 5 minutes

    if (error) {
      log.error("Failed to fetch credentials needing refresh", error);
      throw error;
    }

    return data as Array<
      PlatformCredential & { credentials: Record<string, unknown> }
    >;
  } catch (error) {
    log.error("Error in getCredentialsNeedingRefresh", error);
    throw error;
  }
}

// Preload platform credentials for a team
export const preloadPlatformCredentials = (teamId: string) => {
  void getPlatformCredentials(teamId);
};
