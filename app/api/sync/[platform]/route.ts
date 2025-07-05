import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import {
  getPlatformServiceFactory,
  getPlatformDatabaseService,
} from "@/lib/di/service-resolver";
import { PlatformType } from "@/types";
import { withErrorHandler, ApiErrors } from "@/lib/api/error-handlers";
import { getUserTeams } from "@/utils/team/user-teams";

const _POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
): Promise<NextResponse> => {
  const { platform } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw ApiErrors.UNAUTHORIZED();
  }

  const platformType = platform as PlatformType;
  const validPlatforms: PlatformType[] = [
    "facebook",
    "google",
    "kakao",
    "naver",
    "coupang",
  ];

  if (!validPlatforms.includes(platformType)) {
    throw ApiErrors.BAD_REQUEST(`Invalid platform: ${platform}`);
  }

  // Get user's teams with automatic team creation
  const userTeams = await getUserTeams(user.id);

  if (userTeams.length === 0) {
    throw ApiErrors.NOT_FOUND("No team found for user");
  }

  // Use the first team (primary team)
  const primaryTeam = userTeams[0];
  const teamId = primaryTeam.teamId;
  const userRole = primaryTeam.role;

  if (userRole === "viewer") {
    throw ApiErrors.FORBIDDEN("Viewers cannot perform sync operations");
  }

  // Get platform credentials
  const { data: credential, error: credError } = await supabase
    .from("platform_credentials")
    .select("*")
    .eq("team_id", teamId)
    .eq("platform", platformType)
    .eq("is_active", true)
    .single();

  if (credError || !credential) {
    throw ApiErrors.NOT_FOUND(
      `Active ${platformType} credentials not found for this team`,
    );
  }

  // Get services from DI container
  const platformServiceFactory = await getPlatformServiceFactory();
  const dbService = await getPlatformDatabaseService();

  // Create platform service
  const platformService = platformServiceFactory.createService(platformType);

  // Set credentials - for OAuth platforms, pass teamId and account info
  if (platformType === "google") {
    const credentialsData = {
      teamId: teamId,
      customerId: credential.account_id || null,
      ...credential.credentials,
    };

    platformService.setCredentials(credentialsData);
  } else {
    platformService.setCredentials(credential.credentials);
  }

  // Fetch campaigns from platform
  const campaigns = await platformService.fetchCampaigns();

  // Save campaigns to database
  for (const campaignData of campaigns) {
    const savedCampaign = await dbService.upsertCampaign({
      team_id: teamId,
      platform: platformType,
      platform_campaign_id: campaignData.id,
      platform_credential_id: credential.id,
      name: campaignData.name,
      status: campaignData.status,
      budget: campaignData.budget,
      is_active: campaignData.status === "active",
      raw_data: campaignData.raw_data || null,
    });

    // Fetch and save metrics if available
    // Check if the campaign contains metrics information
    if (savedCampaign && "metrics" in campaignData && campaignData.metrics) {
      const campaignWithMetrics = campaignData as { metrics: unknown }; // Type assertion for now
      const metricsArray = campaignWithMetrics.metrics;

      // Handle metrics array
      if (Array.isArray(metricsArray)) {
        for (const metric of metricsArray) {
          await dbService.upsertCampaignMetrics({
            campaign_id: savedCampaign.id, // Use the internal campaign ID
            date: metric.date || new Date().toISOString().split("T")[0],
            impressions: metric.impressions || 0,
            clicks: metric.clicks || 0,
            conversions: metric.conversions || 0,
            cost: metric.cost || 0,
            revenue: metric.revenue || 0,
            raw_data: { ...metric },
          });
        }
      }
    }
  }

  // Update sync timestamp
  await supabase
    .from("platform_credentials")
    .update({
      synced_at: new Date().toISOString(),
      last_synced_at: new Date().toISOString(),
    })
    .eq("id", credential.id);

  return NextResponse.json({
    success: true,
    message: `Synced ${campaigns.length} campaigns for ${platformType}`,
    data: {
      campaignCount: campaigns.length,
      platform: platformType,
      syncedAt: new Date().toISOString(),
    },
  });
};

export const POST = withErrorHandler(_POST, "sync-platform");
