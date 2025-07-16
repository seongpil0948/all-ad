import { BasePlatformService } from "./base-platform.service";
import {
  ConnectionTestResult,
  TokenRefreshResult,
} from "./platform-service.interface";

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

  async testConnection(): Promise<ConnectionTestResult> {
    return this.executeWithErrorHandling(async () => {
      // Coupang doesn't have API, so we just validate credentials format
      const isValid = await this.validateCredentials();

      return {
        success: isValid,
        accountInfo: {
          id: "coupang-manual",
          name: "Coupang Manual Account",
        },
      };
    }, "testConnection");
  }

  async refreshToken(): Promise<TokenRefreshResult> {
    return this.executeWithErrorHandling(async () => {
      // Coupang doesn't use tokens, return current credentials
      return {
        success: true,
        accessToken: this.credentials?.accessToken || "",
      };
    }, "refreshToken");
  }

  async getAccountInfo(): Promise<{
    id: string;
    name: string;
    currency?: string;
    timezone?: string;
  }> {
    return this.executeWithErrorHandling(async () => {
      return {
        id: "coupang-manual",
        name: "Coupang Manual Account",
        currency: "KRW",
        timezone: "Asia/Seoul",
      };
    }, "getAccountInfo");
  }

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
        team_id: this.teamId || campaign.team_id,
        platform: "coupang" as PlatformType,
        platform_campaign_id: campaign.external_id,
        name: campaign.name,
        status:
          campaign.status === "active"
            ? "active"
            : ("paused" as CampaignStatus),
        is_active: campaign.status === "active",
        budget: campaign.budget || 0,
        created_at: campaign.created_at || new Date().toISOString(),
        updated_at: campaign.updated_at || new Date().toISOString(),
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

      // Update campaign totals using aggregated metrics
      await this.updateCampaignTotals(campaignId);

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

  /**
   * Update campaign totals by aggregating metrics data
   */
  private async updateCampaignTotals(campaignId: string): Promise<void> {
    try {
      const supabase = await createClient();

      // Get aggregated metrics for the campaign
      const { data: metrics, error: metricsError } = await supabase
        .from("campaign_metrics")
        .select("impressions, clicks, cost, conversions, revenue")
        .eq("campaign_id", campaignId);

      if (metricsError) {
        log.error(
          "Failed to fetch campaign metrics for totals update",
          metricsError,
        );

        return;
      }

      // Calculate totals
      const totals = metrics.reduce(
        (acc, metric) => ({
          totalImpressions: acc.totalImpressions + (metric.impressions || 0),
          totalClicks: acc.totalClicks + (metric.clicks || 0),
          totalCost: acc.totalCost + (metric.cost || 0),
          totalConversions: acc.totalConversions + (metric.conversions || 0),
          totalRevenue: acc.totalRevenue + (metric.revenue || 0),
        }),
        {
          totalImpressions: 0,
          totalClicks: 0,
          totalCost: 0,
          totalConversions: 0,
          totalRevenue: 0,
        },
      );

      // Calculate derived metrics
      const ctr =
        totals.totalImpressions > 0
          ? totals.totalClicks / totals.totalImpressions
          : 0;
      const cpc =
        totals.totalClicks > 0 ? totals.totalCost / totals.totalClicks : 0;
      const roas =
        totals.totalCost > 0 ? totals.totalRevenue / totals.totalCost : 0;

      // Update campaign with calculated totals
      const { error: updateError } = await supabase
        .from("campaigns")
        .update({
          raw_data: {
            totalImpressions: totals.totalImpressions,
            totalClicks: totals.totalClicks,
            totalCost: totals.totalCost,
            totalConversions: totals.totalConversions,
            totalRevenue: totals.totalRevenue,
            ctr,
            cpc,
            roas,
            lastUpdated: new Date().toISOString(),
          },
        })
        .eq("id", campaignId);

      if (updateError) {
        log.error("Failed to update campaign totals", updateError);

        return;
      }

      log.info("Successfully updated campaign totals", {
        campaignId,
        totals,
        derivedMetrics: { ctr, cpc, roas },
      });
    } catch (error) {
      log.error("Error updating campaign totals", error);
    }
  }
}
