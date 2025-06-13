import { BasePlatformService } from "./base-platform.service";

import {
  Campaign,
  CampaignMetrics,
  CampaignStatus,
  CoupangCredentials,
  PlatformType,
} from "@/types";
import log from "@/utils/logger";
import { createClient } from "@/utils/supabase/server";

export class CoupangPlatformService extends BasePlatformService {
  platform: PlatformType = "coupang";

  async validateCredentials(): Promise<boolean> {
    const { accessKey, secretKey, vendorId } = this
      .credentials as unknown as CoupangCredentials;

    if (!accessKey || !secretKey || !vendorId) {
      return false;
    }

    // Coupang doesn't provide public API, so we just validate the format
    // In production, these would be used for manual data entry verification
    return accessKey.length > 0 && secretKey.length > 0 && vendorId.length > 0;
  }

  setTeamId(teamId: string): void {
    this.teamId = teamId;
  }

  async fetchCampaigns(): Promise<Campaign[]> {
    log.info("Fetching Coupang campaigns (manual)");

    if (!this.teamId) {
      log.error("Team ID not set for Coupang manual campaigns");

      return [];
    }

    try {
      const supabase = await createClient();

      const { data: manualCampaigns, error } = await supabase
        .from("manual_campaigns")
        .select("*")
        .eq("team_id", this.teamId)
        .eq("platform", "coupang")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (manualCampaigns || []).map((campaign) => ({
        id: campaign.external_id,
        teamId: this.teamId || campaign.team_id,
        platformCampaignId: campaign.external_id,
        name: campaign.name,
        status:
          campaign.status === "active"
            ? "active"
            : ("paused" as CampaignStatus),
        isActive: campaign.status === "active",
        budget: campaign.budget || 0,
        platform: "coupang" as PlatformType,
        currency: "KRW",
        impressions: campaign.impressions || 0,
        clicks: campaign.clicks || 0,
        spend: campaign.spent || 0,
        conversions: campaign.conversions || 0,
        revenue: campaign.revenue || 0,
        createdAt: campaign.created_at,
        updatedAt: campaign.last_updated_at,
      }));
    } catch (error) {
      log.error("Failed to fetch Coupang manual campaigns", error);

      return [];
    }
  }

  async fetchCampaignMetrics(
    campaignId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CampaignMetrics[]> {
    log.info("Fetching Coupang campaign metrics (manual)", {
      campaignId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    if (!this.teamId) {
      log.error("Team ID not set for Coupang manual campaigns");

      return [];
    }

    try {
      const supabase = await createClient();

      // First get the manual campaign ID
      const { data: campaign } = await supabase
        .from("manual_campaigns")
        .select("id")
        .eq("team_id", this.teamId)
        .eq("platform", "coupang")
        .eq("external_id", campaignId)
        .single();

      if (!campaign) {
        log.warn("Manual campaign not found", { campaignId });

        return [];
      }

      // Then fetch metrics
      const { data: metrics, error } = await supabase
        .from("manual_campaign_metrics")
        .select("*")
        .eq("manual_campaign_id", campaign.id)
        .gte("date", startDate.toISOString().split("T")[0])
        .lte("date", endDate.toISOString().split("T")[0])
        .order("date", { ascending: true });

      if (error) throw error;

      return (metrics || []).map((metric) => ({
        date: metric.date,
        impressions: metric.impressions || 0,
        clicks: metric.clicks || 0,
        cost: metric.spent || 0,
        conversions: metric.conversions || 0,
        revenue: metric.revenue || 0,
        ctr:
          metric.impressions > 0
            ? (metric.clicks / metric.impressions) * 100
            : 0,
        cvr: metric.clicks > 0 ? (metric.conversions / metric.clicks) * 100 : 0,
        cpc: metric.clicks > 0 ? metric.spent / metric.clicks : 0,
        cpm:
          metric.impressions > 0
            ? (metric.spent / metric.impressions) * 1000
            : 0,
        roas: metric.spent > 0 ? metric.revenue / metric.spent : 0,
        roi:
          metric.spent > 0
            ? ((metric.revenue - metric.spent) / metric.spent) * 100
            : 0,
      }));
    } catch (error) {
      log.error("Failed to fetch Coupang manual campaign metrics", error);

      return [];
    }
  }

  async updateCampaignBudget(
    campaignId: string,
    budget: number,
  ): Promise<boolean> {
    log.info("Updating Coupang campaign budget (manual)", {
      campaignId,
      budget,
    });

    if (!this.teamId) {
      log.error("Team ID not set for Coupang manual campaigns");

      return false;
    }

    try {
      const supabase = await createClient();

      const { error } = await supabase
        .from("manual_campaigns")
        .update({ budget })
        .eq("team_id", this.teamId)
        .eq("platform", "coupang")
        .eq("external_id", campaignId);

      if (error) throw error;

      log.info("Successfully updated Coupang manual campaign budget", {
        campaignId,
        budget,
      });

      return true;
    } catch (error) {
      log.error("Failed to update Coupang manual campaign budget", error);

      return false;
    }
  }

  async updateCampaignStatus(
    campaignId: string,
    isActive: boolean,
  ): Promise<boolean> {
    log.info("Updating Coupang campaign status (manual)", {
      campaignId,
      isActive,
    });

    if (!this.teamId) {
      log.error("Team ID not set for Coupang manual campaigns");

      return false;
    }

    try {
      const supabase = await createClient();

      const { error } = await supabase
        .from("manual_campaigns")
        .update({ status: isActive ? "active" : "paused" })
        .eq("team_id", this.teamId)
        .eq("platform", "coupang")
        .eq("external_id", campaignId);

      if (error) throw error;

      log.info("Successfully updated Coupang manual campaign status", {
        campaignId,
        isActive,
      });

      return true;
    } catch (error) {
      log.error("Failed to update Coupang manual campaign status", error);

      return false;
    }
  }

  // Additional methods for manual campaign management
  async createManualCampaign(campaign: {
    externalId: string;
    name: string;
    status: "active" | "paused" | "ended";
    budget?: number;
    notes?: string;
  }): Promise<boolean> {
    if (!this.teamId) {
      log.error("Team ID not set for Coupang manual campaigns");

      return false;
    }

    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from("manual_campaigns").insert({
        team_id: this.teamId,
        platform: "coupang",
        external_id: campaign.externalId,
        name: campaign.name,
        status: campaign.status,
        budget: campaign.budget,
        notes: campaign.notes,
        created_by: user?.id,
      });

      if (error) throw error;

      log.info("Successfully created Coupang manual campaign", campaign);

      return true;
    } catch (error) {
      log.error("Failed to create Coupang manual campaign", error);

      return false;
    }
  }

  async updateManualMetrics(
    campaignId: string,
    date: Date,
    metrics: {
      impressions?: number;
      clicks?: number;
      spent?: number;
      conversions?: number;
      revenue?: number;
    },
  ): Promise<boolean> {
    if (!this.teamId) {
      log.error("Team ID not set for Coupang manual campaigns");

      return false;
    }

    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Get the manual campaign ID
      const { data: campaign } = await supabase
        .from("manual_campaigns")
        .select("id")
        .eq("team_id", this.teamId)
        .eq("platform", "coupang")
        .eq("external_id", campaignId)
        .single();

      if (!campaign) {
        log.warn("Manual campaign not found", { campaignId });

        return false;
      }

      // Upsert metrics
      const { error } = await supabase.from("manual_campaign_metrics").upsert(
        {
          manual_campaign_id: campaign.id,
          date: date.toISOString().split("T")[0],
          ...metrics,
          created_by: user?.id,
        },
        {
          onConflict: "manual_campaign_id,date",
        },
      );

      if (error) throw error;

      // TODO: Update campaign totals - need to implement RPC or fetch-update pattern
      // For now, the totals will be calculated from the metrics table when displaying

      log.info("Successfully updated Coupang manual campaign metrics", {
        campaignId,
        date: date.toISOString(),
        metrics,
      });

      return true;
    } catch (error) {
      log.error("Failed to update Coupang manual campaign metrics", error);

      return false;
    }
  }
}
