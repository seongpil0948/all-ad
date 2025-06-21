"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/utils/supabase/server";
import {
  getPlatformServiceFactory,
  getPlatformDatabaseService,
} from "@/lib/di/service-resolver";
import log from "@/utils/logger";
import { PlatformType } from "@/types";
import { CredentialValues } from "@/types/credentials.types";

export async function updateCampaignBudgetAction(
  campaignId: string,
  budget: number,
) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("No user logged in");
    }

    // Check permissions
    const { data: teamMember } = await supabase
      .from("team_members")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!teamMember || teamMember.role === "viewer") {
      throw new Error("Insufficient permissions");
    }

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select(
        `
        *,
        platform_credentials (
          *
        )
      `,
      )
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      throw new Error("Campaign not found");
    }

    // Update in database
    const { error: updateError } = await supabase
      .from("campaigns")
      .update({
        budget,
        updated_at: new Date().toISOString(),
      })
      .eq("id", campaignId);

    if (updateError) {
      throw updateError;
    }

    // Update on the platform
    try {
      const platformServiceFactory = await getPlatformServiceFactory();
      const platformService = platformServiceFactory.createService(
        campaign.platform_credentials.platform,
      );

      await platformService.setCredentials(
        campaign.platform_credentials.credentials,
      );
      await platformService.updateCampaignBudget(
        campaign.platform_campaign_id,
        budget,
      );

      log.info("Campaign budget updated on platform", {
        campaignId,
        platform: campaign.platform_credentials.platform,
        budget,
      });
    } catch (platformError) {
      log.error(`Failed to update budget on platform ${platformError}`);
      // Continue even if platform update fails
    }

    revalidatePath("/dashboard");

    return { success: true, message: "예산이 성공적으로 업데이트되었습니다." };
  } catch (error) {
    log.error(`Error in updateCampaignBudgetAction ${error}`);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update budget",
    };
  }
}

export async function toggleCampaignStatusAction(campaignId: string) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("No user logged in");
    }

    // Check permissions
    const { data: teamMember } = await supabase
      .from("team_members")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!teamMember || teamMember.role === "viewer") {
      throw new Error("Insufficient permissions");
    }

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select(
        `
        *,
        platform_credentials (
          *
        )
      `,
      )
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      throw new Error("Campaign not found");
    }

    const newStatus = !campaign.is_active;

    // Update in database
    const { error: updateError } = await supabase
      .from("campaigns")
      .update({
        is_active: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", campaignId);

    if (updateError) {
      throw updateError;
    }

    // Update on the platform
    try {
      const platformServiceFactory = await getPlatformServiceFactory();
      const platformService = platformServiceFactory.createService(
        campaign.platform_credentials.platform,
      );

      await platformService.setCredentials(
        campaign.platform_credentials.credentials,
      );
      await platformService.updateCampaignStatus(
        campaign.platform_campaign_id,
        newStatus,
      );

      log.info("Campaign status updated on platform", {
        campaignId,
        platform: campaign.platform_credentials.platform,
        isActive: newStatus,
      });
    } catch (platformError) {
      log.error(`Failed to update status on platform ${platformError}`);
      // Continue even if platform update fails
    }

    revalidatePath("/dashboard");

    return {
      success: true,
      message: `캠페인이 ${newStatus ? "활성화" : "비활성화"}되었습니다.`,
    };
  } catch (error) {
    log.error(`Error in toggleCampaignStatusAction ${JSON.stringify(error)}`);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to toggle status",
    };
  }
}

export async function syncAllCampaignsAction() {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("No user logged in");
    }

    // Get user's team
    let teamId = null;

    const { data: masterTeam } = await supabase
      .from("teams")
      .select("id")
      .eq("master_user_id", user.id)
      .maybeSingle();

    if (masterTeam) {
      teamId = masterTeam.id;
    } else {
      const { data: teamMember } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (teamMember) {
        teamId = teamMember.team_id;
      }
    }

    if (!teamId) {
      throw new Error("No team found");
    }

    // Get all active platform credentials
    const { data: credentials, error: credError } = await supabase
      .from("platform_credentials")
      .select("*")
      .eq("team_id", teamId)
      .eq("is_active", true);

    if (credError || !credentials) {
      throw new Error("Failed to fetch platform credentials");
    }

    let totalSynced = 0;
    let errors = [];

    // Sync campaigns for each platform
    for (const cred of credentials) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/sync/${cred.platform}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ teamId }),
          },
        );

        if (response.ok) {
          const result = await response.json();

          totalSynced += result.synced || 0;
        } else {
          errors.push(`Failed to sync ${cred.platform}`);
        }
      } catch (error) {
        log.error(`Sync error for ${cred.platform} ${error}`);
        errors.push(`Error syncing ${cred.platform}`);
      }
    }

    log.info("All campaigns synced", { totalSynced, errors });

    revalidatePath("/dashboard");

    if (errors.length > 0) {
      return {
        success: false,
        message: `동기화 중 일부 오류 발생: ${errors.join(", ")}`,
        synced: totalSynced,
      };
    }

    return {
      success: true,
      message: `${totalSynced}개의 캠페인이 동기화되었습니다.`,
      synced: totalSynced,
    };
  } catch (error) {
    log.error(`Error in syncAllCampaignsAction ${JSON.stringify(error)}`);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to sync campaigns",
    };
  }
}

// Platform credential actions for multi-account support
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

    // Generate a unique account ID for multiple accounts
    const accountId = `${platform}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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

      // Store the manual token in Redis
      await manager.storeTokens(user.id, accountId, {
        access_token: manual_refresh_token || "",
        refresh_token: manual_refresh_token || "",
        expires_in: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year expiry for manual tokens
        refresh_token_expires_in: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year expiry for manual tokens
        scope: "",
        token_type: "Bearer",
      });

      // Save credentials with manual token flag (allowing multiple accounts)
      const { error } = await supabase.from("platform_credentials").insert({
        team_id: team.id,
        platform,
        credentials: { client_id, client_secret },
        data: {
          developer_token,
          manual_token: true,
          connected: true,
          connected_at: new Date().toISOString(),
        },
        account_id: accountId,
        account_name: `${platform} Account ${new Date().toLocaleString()}`,
        is_active: true,
        created_by: user.id,
        user_id: user.id,
      });

      if (error) {
        log.error("Failed to save OAuth credentials", error);
        throw new Error("Failed to save OAuth credentials");
      }
    } else {
      // Save OAuth credentials for normal OAuth flow (allowing multiple accounts)
      const { error } = await supabase.from("platform_credentials").insert({
        team_id: team.id,
        platform,
        credentials: { client_id, client_secret },
        data: { developer_token }, // Additional data
        account_id: accountId,
        account_name: `${platform} Account ${new Date().toLocaleString()}`,
        is_active: false, // Will be activated after OAuth completion
        created_by: user.id,
        user_id: user.id,
      });

      if (error) {
        log.error("Failed to save OAuth credentials", error);
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

    // Generate a unique account ID
    const accountId = `${platform}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Save credentials (allowing multiple accounts)
    const { error } = await supabase.from("platform_credentials").insert({
      team_id: team.id,
      platform,
      credentials,
      account_id: accountId,
      account_name: `${platform} Account ${new Date().toLocaleString()}`,
      is_active: true,
      created_by: user.id,
      user_id: user.id,
    });

    if (error) {
      log.error("Failed to save credentials", error);
      throw new Error("Failed to save credentials");
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings");
}

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
    log.error("Failed to delete credentials", error);
    throw new Error("Failed to delete credentials");
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings");
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
    log.error("Failed to toggle platform credentials", error);
    throw new Error("Failed to toggle platform credentials");
  }

  revalidatePath("/dashboard");
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
  const dbService = await getPlatformDatabaseService();
  const team = await dbService.getUserTeam(user.id);

  if (!team) {
    return [];
  }

  // Get all credentials for the team
  const { data: credentials, error } = await supabase
    .from("platform_credentials")
    .select("*")
    .eq("team_id", team.id)
    .order("created_at", { ascending: false });

  if (error) {
    log.error("Failed to get team credentials", error);

    return [];
  }

  return credentials || [];
}
