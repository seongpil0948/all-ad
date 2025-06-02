"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/utils/supabase/server";
import { platformServiceFactory } from "@/services/platforms/platform-service-factory";
import logger from "@/utils/logger";

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

      logger.info("Campaign budget updated on platform", {
        campaignId,
        platform: campaign.platform_credentials.platform,
        budget,
      });
    } catch (platformError) {
      logger.error(`Failed to update budget on platform ${platformError}`);
      // Continue even if platform update fails
    }

    revalidatePath("/dashboard");

    return { success: true, message: "예산이 성공적으로 업데이트되었습니다." };
  } catch (error) {
    logger.error(`Error in updateCampaignBudgetAction ${error}`);

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

      logger.info("Campaign status updated on platform", {
        campaignId,
        platform: campaign.platform_credentials.platform,
        isActive: newStatus,
      });
    } catch (platformError) {
      logger.error(`Failed to update status on platform ${platformError}`);
      // Continue even if platform update fails
    }

    revalidatePath("/dashboard");

    return {
      success: true,
      message: `캠페인이 ${newStatus ? "활성화" : "비활성화"}되었습니다.`,
    };
  } catch (error) {
    logger.error(
      `Error in toggleCampaignStatusAction ${JSON.stringify(error)}`,
    );

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
        logger.error(`Sync error for ${cred.platform} ${error}`);
        errors.push(`Error syncing ${cred.platform}`);
      }
    }

    logger.info("All campaigns synced", { totalSynced, errors });

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
    logger.error(`Error in syncAllCampaignsAction ${JSON.stringify(error)}`);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to sync campaigns",
    };
  }
}
