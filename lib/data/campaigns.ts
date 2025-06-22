import { cache } from "react";
import "server-only";

import { createClient } from "@/utils/supabase/server";
import { Campaign } from "@/types/campaign.types";
import { CampaignStats } from "@/types/campaign.types";
import log from "@/utils/logger";

// Cache campaign data fetching to prevent duplicate requests
export const getCampaigns = cache(async (teamId: string) => {
  const supabase = await createClient();

  try {
    const { data: campaigns, error } = await supabase
      .from("campaigns")
      .select("*, campaign_metrics(*)")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false });

    if (error) {
      log.error("Failed to fetch campaigns", error);
      throw error;
    }

    return campaigns as Campaign[];
  } catch (error) {
    log.error("Error in getCampaigns", error);
    throw error;
  }
});

// Cache campaign stats calculation
export const getCampaignStats = cache(
  async (teamId: string): Promise<CampaignStats> => {
    const campaigns = await getCampaigns(teamId);

    const stats = campaigns.reduce(
      (acc, campaign) => {
        acc.totalCampaigns++;
        if (campaign.isActive) acc.activeCampaigns++;
        acc.totalBudget += campaign.budget || 0;

        // Aggregate metrics from campaign
        if (campaign.metrics) {
          acc.totalImpressions += campaign.metrics.impressions || 0;
          acc.totalClicks += campaign.metrics.clicks || 0;
          acc.totalSpend += campaign.metrics.cost || 0;
        }

        return acc;
      },
      {
        totalCampaigns: 0,
        activeCampaigns: 0,
        totalBudget: 0,
        totalSpend: 0,
        totalImpressions: 0,
        totalClicks: 0,
        platforms: new Set(campaigns.map((c) => c.platform)).size,
      },
    );

    return stats;
  },
);

// Preload campaigns and stats in parallel
export const preloadCampaignData = (teamId: string) => {
  // These will run in parallel due to React.cache
  void getCampaigns(teamId);
  void getCampaignStats(teamId);
};
