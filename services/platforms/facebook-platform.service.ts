import { BasePlatformService } from "./base-platform.service";

import {
  Campaign,
  CampaignMetrics,
  FacebookCredentials,
} from "@/types/platform";
import { Logger } from "@/utils/logger";

export class FacebookPlatformService extends BasePlatformService {
  platform = "facebook" as const;

  async validateCredentials(): Promise<boolean> {
    const { access_token, ad_account_id } = this
      .credentials as FacebookCredentials;

    if (!access_token || !ad_account_id) {
      return false;
    }

    try {
      // Validate token by making a simple API call
      const response = await fetch(
        `https://graph.facebook.com/v18.0/me?access_token=${access_token}`,
      );

      return response.ok;
    } catch (error) {
      Logger.error("Facebook credential validation error:", error as Error);

      return false;
    }
  }

  async fetchCampaigns(): Promise<Campaign[]> {
    const { access_token, ad_account_id } = this
      .credentials as FacebookCredentials;

    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/act_${ad_account_id}/campaigns?fields=id,name,status,daily_budget,lifetime_budget&access_token=${access_token}`,
      );

      if (!response.ok) {
        throw new Error(`Facebook API error: ${response.statusText}`);
      }

      const data = await response.json();

      return data.data.map((campaign: any) => ({
        platform: "facebook",
        platform_campaign_id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        budget: campaign.daily_budget || campaign.lifetime_budget || 0,
        is_active: campaign.status === "ACTIVE",
        raw_data: campaign,
      }));
    } catch (error) {
      Logger.error("Facebook fetch campaigns error:", error as Error);
      throw error;
    }
  }

  async fetchCampaignMetrics(
    campaignId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CampaignMetrics[]> {
    const { access_token } = this.credentials as FacebookCredentials;

    try {
      const insights = await fetch(
        `https://graph.facebook.com/v18.0/${campaignId}/insights?` +
          `fields=impressions,clicks,conversions,spend,revenue&` +
          `time_range={'since':'${this.formatDate(startDate)}','until':'${this.formatDate(endDate)}'}&` +
          `access_token=${access_token}`,
      );

      if (!insights.ok) {
        throw new Error(`Facebook API error: ${insights.statusText}`);
      }

      const data = await insights.json();

      return data.data.map((metric: any) => ({
        campaign_id: campaignId,
        date: metric.date_start,
        impressions: parseInt(metric.impressions || "0"),
        clicks: parseInt(metric.clicks || "0"),
        conversions: parseInt(metric.conversions || "0"),
        cost: parseFloat(metric.spend || "0"),
        revenue: parseFloat(metric.revenue || "0"),
        raw_data: metric,
      }));
    } catch (error) {
      Logger.error("Facebook fetch metrics error:", error as Error);
      throw error;
    }
  }

  async updateCampaignBudget(
    campaignId: string,
    budget: number,
  ): Promise<boolean> {
    const { access_token } = this.credentials as FacebookCredentials;

    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${campaignId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            daily_budget: budget * 100, // Facebook uses cents
            access_token,
          }),
        },
      );

      return response.ok;
    } catch (error) {
      Logger.error("Facebook update budget error:", error as Error);

      return false;
    }
  }

  async updateCampaignStatus(
    campaignId: string,
    isActive: boolean,
  ): Promise<boolean> {
    const { access_token } = this.credentials as FacebookCredentials;

    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${campaignId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: isActive ? "ACTIVE" : "PAUSED",
            access_token,
          }),
        },
      );

      return response.ok;
    } catch (error) {
      Logger.error("Facebook update status error:", error as Error);

      return false;
    }
  }
}
