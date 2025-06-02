"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/utils/supabase/server";
import log from "@/utils/logger";

export async function getIntegratedData() {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get team
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
      .single();

    if (!teamMember?.team) {
      throw new Error("No team found");
    }

    const team = Array.isArray(teamMember.team)
      ? teamMember.team[0]
      : teamMember.team;
    const teamId = team.id;

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
      .select("*")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false });

    if (campaignsError) {
      log.error("Failed to fetch campaigns", campaignsError, {
        module: "integrated/actions",
        action: "getIntegratedData",
        teamId,
      });
    }

    // Get team members
    const { data: teamMembers, error: teamError } = await supabase
      .from("team_members")
      .select(
        `
        id,
        role,
        created_at,
        user:profiles(
          id,
          email,
          full_name,
          avatar_url
        )
      `,
      )
      .eq("team_id", teamId);

    if (teamError) {
      log.error("Failed to fetch team members", teamError, {
        module: "integrated/actions",
        action: "getIntegratedData",
        teamId,
      });
    }

    // Calculate statistics
    const stats = {
      totalCampaigns: campaigns?.length || 0,
      activeCampaigns: campaigns?.filter((c: any) => c.is_active).length || 0,
      totalBudget:
        campaigns?.reduce((sum: any, c: any) => sum + (c.budget || 0), 0) || 0,
      connectedPlatforms:
        credentials?.filter((c: any) => c.is_active).length || 0,
    };

    return {
      user,
      team,
      credentials: credentials || [],
      campaigns: campaigns || [],
      teamMembers: teamMembers || [],
      stats,
      userRole: teamMember.role,
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
  "use server";

  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get team
    const { data: teams } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .single();

    if (!teams?.team_id) {
      throw new Error("No team found");
    }

    // Get active credentials
    const { data: credentials } = await supabase
      .from("platform_credentials")
      .select("platform")
      .eq("team_id", teams.team_id)
      .eq("is_active", true);

    if (!credentials || credentials.length === 0) {
      return { success: false, message: "No active platforms to sync" };
    }

    // Sync each platform
    const syncPromises = credentials.map(async (cred: any) => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/sync/${cred.platform}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ teamId: teams.team_id }),
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

    return { success: true, message: "All platforms synced successfully" };
  } catch (error) {
    log.error("Failed to sync all platforms", error as Error, {
      module: "integrated/actions",
      action: "syncAllPlatformsAction",
    });

    return { success: false, message: "Failed to sync platforms" };
  }
}
