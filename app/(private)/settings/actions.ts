"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/utils/supabase/server";
import { PlatformDatabaseService } from "@/services/platform-database.service";
import { platformServiceFactory } from "@/services/platforms/platform-service-factory";
import { PlatformType } from "@/types";

export async function savePlatformCredentials(
  platform: PlatformType,
  credentials: Record<string, any>,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  // Get user's team
  const dbService = new PlatformDatabaseService();
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
      const oauthManager = await import("@/lib/oauth/oauth-manager").then(
        (m) => m.OAuthManager,
      );
      const manager = new oauthManager(platform, {
        clientId: client_id,
        clientSecret: client_secret,
        redirectUri: "", // Not needed for manual tokens
        scope: [],
        authorizationUrl: "",
        tokenUrl: "",
      });

      // Generate a unique account ID for manual token
      const accountId = `${platform}_manual_${Date.now()}`;

      // Store the manual token in Redis
      await manager.storeTokens(user.id, accountId, {
        access_token: manual_refresh_token || "",
        refresh_token: manual_refresh_token || "",
        expires_at: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year expiry for manual tokens
        scope: "",
        token_type: "Bearer",
      });

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
  const dbService = new PlatformDatabaseService();
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
  const dbService = new PlatformDatabaseService();
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

export async function getTeamCredentials() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // Get user's team
  const dbService = new PlatformDatabaseService();
  const team = await dbService.getUserTeam(user.id);

  if (!team) {
    return [];
  }

  return await dbService.getTeamCredentials(team.id);
}
