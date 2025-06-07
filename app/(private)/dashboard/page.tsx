import { redirect } from "next/navigation";
import { SupabaseClient } from "@supabase/supabase-js";

import { DashboardDataProvider } from "./DashboardDataProvider";

import { createClient } from "@/utils/supabase/server";
import { CampaignDashboard } from "@/components/dashboard/CampaignDashboard";
import { SyncButton } from "@/components/dashboard/SyncButton";
import { PageHeader } from "@/components/common";
import log from "@/utils/logger";
import { Database } from "@/types/supabase.types";
import { Campaign as AppCampaign, CampaignStats } from "@/types/campaign.types";
import { Campaign as DBCampaign } from "@/types/database.types";
import { transformDbCampaignToApp } from "@/utils/campaign-transformer";

type DBPlatformCredential =
  Database["public"]["Tables"]["platform_credentials"]["Row"];

interface CampaignWithCredentials extends DBCampaign {
  platform_credentials?: Partial<DBPlatformCredential>;
  // Add metrics from campaign_metrics if needed
  clicks?: number;
  impressions?: number;
  cost?: number;
}

async function getCampaignData(
  supabase: SupabaseClient<Database>,
  teamId: string,
): Promise<AppCampaign[]> {
  // First fetch campaigns
  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  if (error) {
    log.error("Error fetching campaigns:", error);

    return [];
  }

  if (!campaigns || campaigns.length === 0) {
    return [];
  }

  // Then fetch platform credentials separately if needed
  const { data: credentials } = await supabase
    .from("platform_credentials")
    .select("*")
    .eq("team_id", teamId);

  // Map credentials to campaigns
  const campaignsWithCredentials = campaigns.map((campaign) => {
    const credential = credentials?.find(
      (c) => c.platform === campaign.platform && c.team_id === campaign.team_id,
    );

    return {
      ...campaign,
      platform_credentials: credential || { platform: campaign.platform },
    };
  });

  // Transform to application layer campaigns
  return campaignsWithCredentials.map((campaign) => {
    // Ensure required fields are not null before transforming
    const campaignWithDefaults: DBCampaign = {
      ...campaign,
      team_id: campaign.team_id || teamId,
      is_active: campaign.is_active ?? true,
      status: campaign.status || "ENABLED",
      synced_at: campaign.synced_at || campaign.created_at,
      raw_data: campaign.raw_data as Record<string, unknown> | null,
    };

    const appCampaign = transformDbCampaignToApp(campaignWithDefaults);

    // Add metrics if available (from extended properties)
    const extendedCampaign = campaign as CampaignWithCredentials;

    if (extendedCampaign.clicks !== undefined) {
      appCampaign.metrics = {
        clicks: extendedCampaign.clicks,
        impressions: extendedCampaign.impressions || 0,
        cost: extendedCampaign.cost || 0,
        conversions: 0,
        revenue: 0,
      };
    }

    return appCampaign;
  });
}

export default async function DashboardPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's team
  let teamId = null;

  // Check if user is master of any team
  const { data: masterTeam } = await supabase
    .from("teams")
    .select("id")
    .eq("master_user_id", user.id)
    .maybeSingle();

  if (masterTeam) {
    teamId = masterTeam.id;
  } else {
    // Get user's team membership
    const { data: membership } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (membership) {
      teamId = membership.team_id;
    }
  }

  if (!teamId) {
    // Create team if doesn't exist
    const { data: newTeamId } = await supabase.rpc("create_team_for_user", {
      user_id: user.id,
    });

    teamId = newTeamId;
  }

  // Fetch initial data
  const campaigns = await getCampaignData(supabase, teamId);

  // Calculate statistics
  const stats: CampaignStats = {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter((c) => c.isActive).length,
    totalBudget: campaigns.reduce((sum, c) => sum + (c.budget || 0), 0),
    totalSpend: campaigns.reduce((sum, c) => sum + (c.metrics?.cost || 0), 0),
    totalClicks: campaigns.reduce(
      (sum, c) => sum + (c.metrics?.clicks || 0),
      0,
    ),
    totalImpressions: campaigns.reduce(
      (sum, c) => sum + (c.metrics?.impressions || 0),
      0,
    ),
    platforms: Array.from(new Set(campaigns.map((c) => c.platform))).length,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <PageHeader
          pageSubtitle="모든 광고 플랫폼의 캠페인을 한눈에 관리하세요."
          pageTitle="대시보드"
        />
        <SyncButton />
      </div>

      <DashboardDataProvider initialCampaigns={campaigns} initialStats={stats}>
        <CampaignDashboard />
      </DashboardDataProvider>
    </div>
  );
}
