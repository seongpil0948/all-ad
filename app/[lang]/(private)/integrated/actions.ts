"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { User } from "@supabase/supabase-js";

import { createClient } from "@/utils/supabase/server";
import log from "@/utils/logger";
import {
  Team,
  PlatformCredential,
  UserRole,
  CampaignMetrics,
  TeamMemberWithProfile,
} from "@/types";
import { Campaign as AppCampaign } from "@/types/campaign.types";

interface IntegratedData {
  user: User;
  team: Team;
  credentials: PlatformCredential[];
  campaigns: AppCampaign[];
  teamMembers: TeamMemberWithProfile[];
  stats: {
    totalCampaigns: number;
    activeCampaigns: number;
    totalBudget: number;
    totalSpend: number;
    totalClicks: number;
    totalImpressions: number;
    platforms: number;
    connectedPlatforms: number;
  };
  userRole: UserRole;
}

export async function getIntegratedData(): Promise<IntegratedData> {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    // First, check if user is a team master
    const { data: masterTeam } = await supabase
      .from("teams")
      .select("*")
      .eq("master_user_id", user.id)
      .maybeSingle();

    let teamId: string;
    let userRole: UserRole = "master";

    if (masterTeam) {
      // User is a team master
      teamId = masterTeam.id;
    } else {
      // Check if user is a team member
      const { data: teamMember } = await supabase
        .from("team_members")
        .select(
          `
          team:teams(
            id,
            name,
            created_at
          ),
          role
        `,
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (!teamMember?.team) {
        throw new Error("No team found");
      }

      const team = Array.isArray(teamMember.team)
        ? teamMember.team[0]
        : teamMember.team;

      teamId = team.id;
      userRole = teamMember.role;
    }

    // Ensure we have the full team object
    const { data: fullTeam } = await supabase
      .from("teams")
      .select("*")
      .eq("id", teamId)
      .single();

    if (!fullTeam) {
      throw new Error("Team not found");
    }

    // Get credentials
    const { data: credentials, error: credentialsError } = await supabase
      .from("platform_credentials")
      .select("*")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false });

    if (credentialsError) {
      log.error("Failed to fetch credentials", credentialsError, {
        module: "integrated/actions",
        action: "getIntegratedData",
        teamId,
      });
    }

    // Get campaigns
    const { data: campaigns, error: campaignsError } = await supabase
      .from("campaigns")
      .select("*, campaign_metrics(*)")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false });

    if (campaignsError) {
      log.error("Failed to fetch campaigns", campaignsError, {
        module: "integrated/actions",
        action: "getIntegratedData",
        teamId,
      });
    }

    // Get team members with profiles
    const { data: teamMembers, error: teamError } = await supabase
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

    // Get profiles for team members
    let teamMembersWithProfiles: TeamMemberWithProfile[] = [];

    if (teamMembers && !teamError) {
      const userIds = teamMembers.map((member) => member.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);

      teamMembersWithProfiles = teamMembers.map((member) => ({
        ...member,
        team_id: member.team_id || teamId, // Ensure team_id is set
        profiles: profiles?.find((p) => p.id === member.user_id) || null,
      }));
    }

    if (teamError) {
      log.error("Failed to fetch team members", teamError, {
        module: "integrated/actions",
        action: "getIntegratedData",
        teamId,
      });
    }

    // Calculate statistics
    const totalSpend =
      campaigns?.reduce((sum, c) => {
        const campaignSpend = (c.campaign_metrics || []).reduce(
          (metricSum: number, m: CampaignMetrics) => metricSum + (m.cost || 0),
          0,
        );
        return sum + campaignSpend;
      }, 0) || 0;

    const totalClicks =
      campaigns?.reduce((sum, c) => {
        const campaignClicks = (c.campaign_metrics || []).reduce(
          (metricSum: number, m: CampaignMetrics) =>
            metricSum + (m.clicks || 0),
          0,
        );
        return sum + campaignClicks;
      }, 0) || 0;

    const totalImpressions =
      campaigns?.reduce((sum, c) => {
        const campaignImpressions = (c.campaign_metrics || []).reduce(
          (metricSum: number, m: CampaignMetrics) =>
            metricSum + (m.impressions || 0),
          0,
        );
        return sum + campaignImpressions;
      }, 0) || 0;

    const stats = {
      totalCampaigns: campaigns?.length || 0,
      activeCampaigns: campaigns?.filter((c) => c.is_active).length || 0,
      totalBudget: campaigns?.reduce((sum, c) => sum + (c.budget || 0), 0) || 0,
      totalSpend,
      totalClicks,
      totalImpressions,
      platforms: new Set(campaigns?.map((c) => c.platform) || []).size,
      connectedPlatforms: credentials?.filter((c) => c.is_active).length || 0,
    };

    // Remove the unused extendedStats

    return {
      user,
      team: fullTeam,
      credentials: credentials || [],
      campaigns: campaigns || [],
      teamMembers: teamMembersWithProfiles || [],
      stats,
      userRole: userRole,
    };
  } catch (error) {
    log.error("Failed to get integrated data", error as Error, {
      module: "integrated/actions",
      action: "getIntegratedData",
    });
    throw error;
  }
}

export async function syncAllPlatformsAction() {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    // First, check if user is a team master
    const { data: masterTeam } = await supabase
      .from("teams")
      .select("id")
      .eq("master_user_id", user.id)
      .maybeSingle();

    let teamId: string;

    if (masterTeam) {
      // User is a team master
      teamId = masterTeam.id;
    } else {
      // Check if user is a team member
      const { data: teams } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!teams?.team_id) {
        throw new Error("No team found");
      }
      teamId = teams.team_id;
    }

    // Get active credentials
    const { data: credentials } = await supabase
      .from("platform_credentials")
      .select("platform")
      .eq("team_id", teamId)
      .eq("is_active", true);

    if (!credentials || credentials.length === 0) {
      log.warn("No active platforms to sync", {
        module: "integrated/actions",
        action: "syncAllPlatformsAction",
        teamId: teamId,
      });

      return;
    }

    // Sync each platform
    const syncPromises = credentials.map(async (cred) => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL}/api/sync/${cred.platform}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ teamId: teamId }),
          },
        );

        if (!response.ok) {
          throw new Error(`Failed to sync ${cred.platform}`);
        }

        return { platform: cred.platform, success: true };
      } catch (error) {
        log.error(`Failed to sync platform ${cred.platform}`, error as Error, {
          module: "integrated/actions",
          action: "syncAllPlatformsAction",
          platform: cred.platform,
        });

        return { platform: cred.platform, success: false };
      }
    });

    await Promise.all(syncPromises);

    revalidatePath("/integrated");
    revalidatePath("/dashboard");
    // Invalidate team-scoped cached data for dashboard
    revalidateTag(`team:${teamId}:campaigns`);
    revalidateTag(`team:${teamId}:dashboard`);
  } catch (error) {
    log.error("Failed to sync all platforms", error as Error, {
      module: "integrated/actions",
      action: "syncAllPlatformsAction",
    });

    throw error;
  }
}
