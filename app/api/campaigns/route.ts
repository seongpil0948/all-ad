import { createClient } from "@/utils/supabase/server";
import log from "@/utils/logger";
import { transformDbCampaignToApp } from "@/utils/campaign-transformer";
import { successResponse } from "@/lib/api/response";
import { ApiErrors, handleApiError } from "@/lib/api/errors";
import { getUserPrimaryTeamId } from "@/utils/team/user-teams";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw ApiErrors.UNAUTHORIZED();
    }

    // Use utility function to get primary team ID
    const teamId = await getUserPrimaryTeamId(user.id);

    if (!teamId) {
      log.warn("No team found for user", {
        userId: user.id,
        email: user.email,
      });

      return successResponse([]);
    }

    log.info("Using team for campaigns fetch", {
      userId: user.id,
      teamId,
      email: user.email,
    });

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform");
    const status = searchParams.get("status");

    // Build query
    let query = supabase.from("campaigns").select("*").eq("team_id", teamId);

    if (platform) {
      query = query.eq("platform", platform);
    }

    if (status !== null) {
      query = query.eq("is_active", status === "active");
    }

    const { data: campaigns, error: campaignsError } = await query.order(
      "updated_at",
      { ascending: false },
    );

    if (campaignsError) {
      log.error("Error fetching campaigns", { error: campaignsError });
      throw ApiErrors.INTERNAL_ERROR();
    }

    // Calculate stats
    const stats = {
      totalCampaigns: campaigns?.length || 0,
      activeCampaigns: campaigns?.filter((c) => c.is_active).length || 0,
      totalSpend: campaigns?.reduce((sum, c) => sum + (c.spend || 0), 0) || 0,
      totalClicks: campaigns?.reduce((sum, c) => sum + (c.clicks || 0), 0) || 0,
      totalImpressions:
        campaigns?.reduce((sum, c) => sum + (c.impressions || 0), 0) || 0,
      averageCTR: 0,
      averageCPC: 0,
    };

    if (stats.totalImpressions > 0) {
      stats.averageCTR = (stats.totalClicks / stats.totalImpressions) * 100;
    }
    if (stats.totalClicks > 0) {
      stats.averageCPC = stats.totalSpend / stats.totalClicks;
    }

    const transformedCampaigns = (campaigns || []).map(
      transformDbCampaignToApp,
    );

    return successResponse({
      campaigns: transformedCampaigns,
      stats,
    });
  } catch (error) {
    return handleApiError(error, "GET /api/campaigns");
  }
}
