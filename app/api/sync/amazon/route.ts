import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import { AmazonPlatformService } from "@/services/platforms/amazon-platform.service";
import { Campaign } from "@/types";
import log from "@/utils/logger";

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 사용자의 팀 정보 조회
    const { data: teamMember } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .single();

    if (!teamMember?.team_id) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Amazon 자격 증명 조회
    const { data: credentials } = await supabase
      .from("platform_credentials")
      .select("*")
      .eq("team_id", teamMember.team_id)
      .eq("platform", "amazon")
      .eq("is_active", true);

    if (!credentials || credentials.length === 0) {
      return NextResponse.json(
        { error: "No active Amazon credentials found" },
        { status: 404 },
      );
    }

    const results = [];

    // 각 Amazon 계정에 대해 동기화 수행
    for (const credential of credentials) {
      try {
        log.info("Starting Amazon sync", {
          accountId: credential.account_id,
          teamId: teamMember.team_id,
        });

        // Amazon 플랫폼 서비스 초기화
        const amazonService = new AmazonPlatformService();

        await amazonService.initialize(credential);

        // 캠페인 동기화
        const campaigns = await amazonService.fetchCampaigns();

        // 데이터베이스에 캠페인 저장
        for (const campaign of campaigns) {
          await supabase.from("campaigns").upsert(
            {
              team_id: teamMember.team_id,
              platform: "amazon",
              platform_campaign_id: campaign.platform_campaign_id,
              platform_credential_id: credential.id,
              name: campaign.name,
              status: campaign.status,
              is_active: campaign.is_active,
              budget: campaign.budget,
              raw_data: campaign.raw_data,
              synced_at: new Date().toISOString(),
            },
            {
              onConflict: "team_id,platform,platform_campaign_id",
            },
          );
        }

        // 최근 30일 메트릭 동기화
        const endDate = new Date();
        const startDate = new Date();

        startDate.setDate(endDate.getDate() - 30);

        const campaignIds = campaigns.map(
          (c: Campaign) => c.platform_campaign_id,
        );

        if (campaignIds.length > 0) {
          try {
            const metrics = await amazonService.getCampaignMetrics(
              campaignIds,
              {
                startDate: startDate.toISOString().split("T")[0],
                endDate: endDate.toISOString().split("T")[0],
              },
            );

            // 메트릭 데이터 저장
            for (const metric of metrics) {
              // 해당 캠페인의 UUID 조회
              const { data: campaignData } = await supabase
                .from("campaigns")
                .select("id")
                .eq("team_id", teamMember.team_id)
                .eq("platform", "amazon")
                .eq("platform_campaign_id", metric.campaign_id)
                .single();

              if (campaignData) {
                await supabase.from("campaign_metrics").upsert(
                  {
                    campaign_id: campaignData.id,
                    date: metric.date,
                    impressions: metric.impressions,
                    clicks: metric.clicks,
                    cost: metric.cost,
                    conversions: metric.conversions,
                    revenue: metric.revenue,
                    raw_data: metric.raw_data,
                  },
                  {
                    onConflict: "campaign_id,date",
                  },
                );
              }
            }

            log.info("Amazon metrics synced", {
              accountId: credential.account_id,
              metricsCount: metrics.length,
            });
          } catch (metricsError) {
            log.error("Failed to sync Amazon metrics", {
              error: metricsError,
              accountId: credential.account_id,
            });
          }
        }

        // 자격 증명 동기화 시간 업데이트
        await supabase
          .from("platform_credentials")
          .update({ last_synced_at: new Date().toISOString() })
          .eq("id", credential.id);

        results.push({
          account_id: credential.account_id,
          account_name: credential.account_name,
          success: true,
          campaigns_count: campaigns.length,
          synced_at: new Date().toISOString(),
        });

        log.info("Amazon sync completed", {
          accountId: credential.account_id,
          campaignsCount: campaigns.length,
        });
      } catch (error) {
        log.error("Amazon sync failed for account", {
          error,
          accountId: credential.account_id,
        });

        results.push({
          account_id: credential.account_id,
          account_name: credential.account_name,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          synced_at: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      platform: "amazon",
      accounts_synced: results.length,
      results,
    });
  } catch (error) {
    log.error("Amazon sync API error", { error });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
