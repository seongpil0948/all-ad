"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/utils/supabase/server";
import {
  getPlatformDatabaseService,
  getPlatformServiceFactory,
} from "@/lib/di/service-resolver";
import { PlatformType } from "@/types";
import { CredentialValues } from "@/types/credentials.types";

export async function savePlatformCredentials(
  platform: PlatformType,
  credentials: CredentialValues,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  // Get user's team
  const dbService = await getPlatformDatabaseService();
  const team = await dbService.getUserTeam(user.id);

  if (!team) {
    throw new Error("User has no team");
  }

  // For OAuth platforms, we just save the OAuth app credentials
  // The actual validation happens during the OAuth flow
  const oauthPlatforms = ["google", "facebook", "kakao"];

  if (oauthPlatforms.includes(platform)) {
    // For OAuth platforms, save the OAuth app credentials
    const {
      client_id,
      client_secret,
      developer_token,
      manual_refresh_token,
      manual_token,
    } = credentials;

    if (!client_id || !client_secret) {
      throw new Error("Client ID and Client Secret are required");
    }

    // For Google, developer token is also required
    if (platform === "google" && !developer_token) {
      throw new Error("Developer Token is required for Google Ads");
    }

    // Check if using manual refresh token
    if (manual_refresh_token || manual_token) {
      // Store with manual refresh token
      // Legacy OAuth manager removed - manual token storage needs reimplementation
      // TODO: Implement manual token storage
      console.warn("Manual token storage needs to be reimplemented");

      // Generate a unique account ID for manual token
      const accountId = `${platform}_manual_${Date.now()}`;

      // Save credentials with manual token flag
      const success = await dbService.savePlatformCredentials(
        team.id,
        platform,
        { client_id, client_secret },
        user.id,
        {
          developer_token,
          manual_token: true,
          connected: true,
          connected_at: new Date().toISOString(),
        },
        accountId,
      );

      if (!success) {
        throw new Error("Failed to save OAuth credentials");
      }
    } else {
      // Save OAuth credentials for normal OAuth flow
      const success = await dbService.savePlatformCredentials(
        team.id,
        platform,
        { client_id, client_secret },
        user.id,
        { developer_token }, // Additional data
      );

      if (!success) {
        throw new Error("Failed to save OAuth credentials");
      }
    }
  } else {
    // For API key platforms, validate credentials
    const platformServiceFactory = await getPlatformServiceFactory();
    const service = platformServiceFactory.createService(platform);

    service.setCredentials(credentials);
    const isValid = await service.validateCredentials();

    if (!isValid) {
      throw new Error("Invalid credentials");
    }

    // Save credentials
    const success = await dbService.savePlatformCredentials(
      team.id,
      platform,
      credentials,
      user.id,
    );

    if (!success) {
      throw new Error("Failed to save credentials");
    }
  }

  revalidatePath("/settings");
}

export async function deletePlatformCredentials(platform: PlatformType) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  // Get user's team
  const dbService = await getPlatformDatabaseService();
  const team = await dbService.getUserTeam(user.id);

  if (!team) {
    throw new Error("User has no team");
  }

  const success = await dbService.deletePlatformCredentials(team.id, platform);

  if (!success) {
    throw new Error("Failed to delete credentials");
  }

  revalidatePath("/settings");
}

export async function togglePlatformCredentials(
  platform: PlatformType,
  isActive: boolean,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  // Get user's team
  const dbService = await getPlatformDatabaseService();
  const team = await dbService.getUserTeam(user.id);

  if (!team) {
    throw new Error("User has no team");
  }

  // Update the is_active status in the database
  const { error } = await supabase
    .from("platform_credentials")
    .update({ is_active: isActive })
    .eq("team_id", team.id)
    .eq("platform", platform);

  if (error) {
    throw new Error("Failed to toggle platform credentials");
  }

  revalidatePath("/settings");
}

// Multi-account support actions
export async function deletePlatformCredentialById(credentialId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  // Get user's team
  const dbService = await getPlatformDatabaseService();
  const team = await dbService.getUserTeam(user.id);

  if (!team) {
    throw new Error("User has no team");
  }

  // Delete by ID instead of platform
  const { error } = await supabase
    .from("platform_credentials")
    .delete()
    .eq("id", credentialId)
    .eq("team_id", team.id);

  if (error) {
    throw new Error("Failed to delete credentials");
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function togglePlatformCredentialById(
  credentialId: string,
  isActive: boolean,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  // Get user's team
  const dbService = await getPlatformDatabaseService();
  const team = await dbService.getUserTeam(user.id);

  if (!team) {
    throw new Error("User has no team");
  }

  // Update the is_active status by ID
  const { error } = await supabase
    .from("platform_credentials")
    .update({ is_active: isActive })
    .eq("id", credentialId)
    .eq("team_id", team.id);

  if (error) {
    throw new Error("Failed to toggle platform credentials");
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function getTeamCredentials() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // Get user's team
  const dbService = await getPlatformDatabaseService();
  const team = await dbService.getUserTeam(user.id);

  if (!team) {
    return [];
  }

  return await dbService.getTeamCredentials(team.id);
}

export async function refreshCredentials() {
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}
