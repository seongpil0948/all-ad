import "server-only";

import { PlatformType } from "@/types";
import { createClient } from "@/utils/supabase/server";
import log from "@/utils/logger";

export interface PlatformOAuthCredentials {
  clientId: string;
  clientSecret: string;
  developerToken?: string;
  redirectUri: string;
}

// Store user's OAuth credentials securely
export async function storePlatformOAuthCredentials(
  teamId: string,
  platform: PlatformType,
  credentials: PlatformOAuthCredentials,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    // Store credentials in platform_credentials table with encrypted JSON
    const { error } = await supabase.from("platform_credentials").insert({
      team_id: teamId,
      platform,
      credentials: {
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        developer_token: credentials.developerToken,
        redirect_uri: credentials.redirectUri,
      },
      is_active: false, // Will be activated after successful OAuth
      account_id: `pending_${Date.now()}`, // Temporary ID until OAuth completes
    });

    if (error) {
      log.error("Failed to store OAuth credentials", { platform, error });
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    log.error("Error storing OAuth credentials", { platform, error });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Get user's OAuth credentials
export async function getPlatformOAuthCredentials(
  teamId: string,
  platform: PlatformType,
): Promise<PlatformOAuthCredentials | null> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("platform_credentials")
      .select("credentials")
      .eq("team_id", teamId)
      .eq("platform", platform)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    const creds = data.credentials as any;
    
    return {
      clientId: creds.client_id,
      clientSecret: creds.client_secret,
      developerToken: creds.developer_token,
      redirectUri: creds.redirect_uri,
    };
  } catch (error) {
    log.error("Error getting OAuth credentials", { platform, error });
    return null;
  }
}

// Update OAuth credentials after successful connection
export async function updatePlatformOAuthConnection(
  teamId: string,
  platform: PlatformType,
  accountId: string,
  accountName: string,
  tokens: {
    access_token: string;
    refresh_token?: string;
    expires_at?: string;
    scope?: string;
  },
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    // Update the pending credential with real account info and tokens
    const { error } = await supabase
      .from("platform_credentials")
      .update({
        account_id: accountId,
        account_name: accountName,
        credentials: {
          ...(await getPlatformOAuthCredentials(teamId, platform)),
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: tokens.expires_at,
          scope: tokens.scope,
        },
        is_active: true,
        last_synced_at: new Date().toISOString(),
      })
      .eq("team_id", teamId)
      .eq("platform", platform)
      .like("account_id", "pending_%");

    if (error) {
      log.error("Failed to update OAuth connection", { platform, error });
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    log.error("Error updating OAuth connection", { platform, error });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}