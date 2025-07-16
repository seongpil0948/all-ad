import { redirect } from "next/navigation";
import { SupabaseClient } from "@supabase/supabase-js";
import { User } from "@supabase/supabase-js";
import { Metadata } from "next";

import {
  savePlatformCredentials,
  deletePlatformCredentialById,
  togglePlatformCredentialById,
} from "../settings/actions";
import { syncAllPlatformsAction } from "../integrated/actions";

import { DashboardClient } from "./components/DashboardClient";

import { createClient } from "@/utils/supabase/server";
import { SyncButton } from "@/components/dashboard/SyncButton";
import { PageHeader } from "@/components/common";
import log from "@/utils/logger";
import { Database } from "@/types/supabase.types";
import { Campaign as AppCampaign, CampaignStats } from "@/types/campaign.types";
import {
  Campaign as DBCampaign,
  Team,
  PlatformCredential,
  UserRole,
  TeamMemberWithProfile,
} from "@/types";
import { transformDbCampaignToApp } from "@/utils/campaign-transformer";
import { getDictionary, type Locale } from "@/app/[lang]/dictionaries";

type DBPlatformCredential =
  Database["public"]["Tables"]["platform_credentials"]["Row"];

interface CampaignWithCredentials extends DBCampaign {
  platform_credentials?: Partial<DBPlatformCredential>;
  // Add metrics from campaign_metrics if needed
  clicks?: number;
  impressions?: number;
  cost?: number;
}

interface IntegratedDashboardData {
  user: User;
  team: Team;
  credentials: PlatformCredential[];
  campaigns: AppCampaign[];
  teamMembers: TeamMemberWithProfile[];
  stats: CampaignStats & {
    connectedPlatforms: number;
  };
  userRole: UserRole;
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
      raw_data: campaign.raw_data,
    };

    const appCampaign = transformDbCampaignToApp(campaignWithDefaults);

    // Add metrics if available (from extended properties)
    const extendedCampaign = campaign as CampaignWithCredentials;

    if (extendedCampaign.clicks !== undefined) {
      appCampaign.metrics = {
        date: new Date().toISOString().split("T")[0],
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

async function getIntegratedDashboardData(
  supabase: SupabaseClient<Database>,
  user: User,
  teamId: string,
  _lang: string,
): Promise<IntegratedDashboardData> {
  // Get full team data
  const { data: fullTeam } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .single();

  if (!fullTeam) {
    throw new Error("Team not found");
  }

  // Determine user role
  let userRole: UserRole = "master";

  if (fullTeam.master_user_id !== user.id) {
    const { data: membership } = await supabase
      .from("team_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("team_id", teamId)
      .maybeSingle();

    if (membership) {
      userRole = membership.role;
    }
  }

  // Get credentials
  const { data: credentials } = await supabase
    .from("platform_credentials")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  // Get campaigns
  const campaigns = await getCampaignData(supabase, teamId);

  // Get team members with profiles
  const { data: teamMembers } = await supabase
    .from("team_members")
    .select(
      `
      id,
      team_id,
      role,
      joined_at,
      user_id,
      invited_by
    `,
    )
    .eq("team_id", teamId);

  let teamMembersWithProfiles: TeamMemberWithProfile[] = [];

  if (teamMembers) {
    const userIds = teamMembers
      .map((member) => member.user_id)
      .filter((x): x is string => !!x);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", userIds);

    teamMembersWithProfiles = teamMembers
      .filter(
        (member): member is typeof member & { user_id: string } =>
          !!member.user_id,
      )
      .map((member) => ({
        ...member,
        user_id: member.user_id as string,
        team_id: member.team_id || teamId,
        profiles: profiles?.find((p) => p.id === member.user_id) || null,
      }));
  }

  // Calculate statistics
  const stats: CampaignStats & { connectedPlatforms: number } = {
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
    connectedPlatforms: credentials?.filter((c) => c.is_active).length || 0,
  };

  return {
    user,
    team: fullTeam,
    credentials: credentials || [],
    campaigns,
    teamMembers: teamMembersWithProfiles,
    stats,
    userRole,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  return {
    title: dict.dashboard.title,
    description: dict.dashboard.subtitle,
    openGraph: {
      title: `${dict.dashboard.title} - A.ll + Ad`,
      description: dict.dashboard.subtitle,
      url: `/${lang}/dashboard`,
      images: [
        {
          url: "/og-dashboard.png",
          width: 1200,
          height: 630,
          alt: dict.dashboard.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${dict.dashboard.title} - A.ll + Ad`,
      description: dict.dashboard.subtitle,
      images: ["/og-dashboard.png"],
    },
  };
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${lang}/login`);
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

  // Fetch all integrated dashboard data
  const dashboardData = await getIntegratedDashboardData(
    supabase,
    user,
    teamId,
    lang,
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <PageHeader
          pageSubtitle={dict.dashboard.subtitle}
          pageTitle={dict.dashboard.title}
        />
        <form action={syncAllPlatformsAction}>
          <SyncButton />
        </form>
      </div>

      <DashboardClient
        dashboardData={dashboardData}
        teamId={teamId!}
        userId={user.id}
        onDelete={deletePlatformCredentialById}
        onSave={savePlatformCredentials}
        onToggle={togglePlatformCredentialById}
      />
    </div>
  );
}
