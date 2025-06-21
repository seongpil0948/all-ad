"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { getPlatformServiceFactory } from "@/services/platforms";
import log from "@/utils/logger";

export async function syncGoogleAdsCampaigns() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  try {
    // 사용자의 현재 팀 가져오기
    const { data: teamMember } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .single();

    if (!teamMember) {
      throw new Error("Team not found");
    }

    // Google Ads 자격 증명 가져오기
    const { data: credential, error: credError } = await supabase
      .from("platform_credentials")
      .select("*")
      .eq("team_id", teamMember.team_id)
      .eq("platform", "google")
      .eq("is_active", true)
      .single();

    if (credError || !credential) {
      throw new Error("Google Ads credentials not found");
    }

    // 플랫폼 서비스 사용하여 캠페인 동기화
    const platformServiceFactory = getPlatformServiceFactory();
    const googleAdsService = platformServiceFactory.createService("google");

    // credentials와 settings 병합
    const fullCredentials = {
      ...credential.credentials,
      customerId:
        credential.settings?.customerId || credential.credentials.customerId,
    };

    googleAdsService.setCredentials(fullCredentials);

    // 캠페인 가져오기
    const campaigns = await googleAdsService.fetchCampaigns();

    // 데이터베이스에 캠페인 저장/업데이트
    for (const campaign of campaigns) {
      const { error: upsertError } = await supabase.from("campaigns").upsert(
        {
          team_id: teamMember.team_id,
          platform: "google",
          platform_campaign_id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          is_active: campaign.status === "active",
          budget: campaign.budget,
          budget_type: "daily",
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "team_id,platform,platform_campaign_id",
        },
      );

      if (upsertError) {
        log.error("Failed to upsert campaign", upsertError);
      }

      // 메트릭이 있으면 campaign_metrics 테이블에도 저장
      if (campaign.metrics) {
        const { error: metricsError } = await supabase
          .from("campaign_metrics")
          .insert({
            campaign_id: campaign.id,
            team_id: teamMember.team_id,
            date: new Date().toISOString().split("T")[0],
            impressions: campaign.metrics.impressions || 0,
            clicks: campaign.metrics.clicks || 0,
            spend: campaign.metrics.cost || 0,
            conversions: campaign.metrics.conversions || 0,
            revenue: 0, // Google Ads에서는 별도로 가져와야 함
          });

        if (metricsError) {
          log.error("Failed to insert campaign metrics", metricsError);
        }
      }
    }

    // 동기화 로그 저장
    await supabase.from("sync_logs").insert({
      team_id: teamMember.team_id,
      platform: "google",
      sync_type: "campaigns",
      status: "success",
      records_synced: campaigns.length,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    });

    log.info("Google Ads campaigns synced successfully", {
      teamId: teamMember.team_id,
      campaignCount: campaigns.length,
    });

    revalidatePath("/dashboard");
    revalidatePath("/integrated");

    return { success: true, count: campaigns.length };
  } catch (error) {
    log.error("Failed to sync Google Ads campaigns", error);

    // 동기화 실패 로그 저장
    const { data: teamMember } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .single();

    if (teamMember) {
      await supabase.from("sync_logs").insert({
        team_id: teamMember.team_id,
        platform: "google",
        sync_type: "campaigns",
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      });
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to sync campaigns",
    };
  }
}

export async function updateGoogleAdsCampaignStatus(
  campaignId: string,
  isActive: boolean,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  try {
    // 사용자의 현재 팀 가져오기
    const { data: teamMember } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .single();

    if (!teamMember) {
      throw new Error("Team not found");
    }

    // Google Ads 자격 증명 가져오기
    const { data: credential, error: credError } = await supabase
      .from("platform_credentials")
      .select("*")
      .eq("team_id", teamMember.team_id)
      .eq("platform", "google")
      .eq("is_active", true)
      .single();

    if (credError || !credential) {
      throw new Error("Google Ads credentials not found");
    }

    // 플랫폼 서비스 사용하여 캠페인 상태 업데이트
    const platformServiceFactory = getPlatformServiceFactory();
    const googleAdsService = platformServiceFactory.createService("google");

    const fullCredentials = {
      ...credential.credentials,
      customerId:
        credential.settings?.customerId || credential.credentials.customerId,
    };

    googleAdsService.setCredentials(fullCredentials);

    const success = await googleAdsService.updateCampaignStatus(
      campaignId,
      isActive,
    );

    if (success) {
      // 데이터베이스 업데이트
      await supabase
        .from("campaigns")
        .update({
          is_active: isActive,
          status: isActive ? "active" : "paused",
          updated_at: new Date().toISOString(),
        })
        .eq("team_id", teamMember.team_id)
        .eq("platform", "google")
        .eq("platform_campaign_id", campaignId);

      log.info("Campaign status updated", {
        teamId: teamMember.team_id,
        campaignId,
        isActive,
      });

      revalidatePath("/dashboard");
      revalidatePath("/integrated");
    }

    return { success };
  } catch (error) {
    log.error("Failed to update campaign status", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update status",
    };
  }
}
