import { GoogleAdsOAuthClient } from "./core/google-ads-oauth-client";

import log from "@/utils/logger";

// Google Ads query result interface
interface GoogleAdsCampaignResult {
  campaign: {
    id: string;
    name: string;
    status: string;
    budget?: {
      amount_micros?: string;
    };
  };
  metrics: {
    impressions: number;
    clicks: number;
    cost_micros: string;
    conversions: number;
    average_cpm: number;
  };
}

// Campaign data interface
interface CampaignData {
  id: string;
  name: string;
  platform: "google";
  status: "active" | "paused" | "removed";
  budget: number;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  ctr: number;
  conversionRate: number;
  cpc: number;
  cpa: number;
  averageCpm: number;
  updatedAt: string;
}

// Google Ads Integration Service with simplified OAuth
export class GoogleAdsOAuthIntegrationService {
  private client: GoogleAdsOAuthClient;

  constructor(teamId: string, customerId?: string) {
    this.client = new GoogleAdsOAuthClient({ teamId, customerId });
  }

  // Get campaigns with performance metrics
  async getCampaigns(): Promise<CampaignData[]> {
    const query = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.budget.amount_micros,
        campaign_budget.type,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.average_cpm
      FROM campaign
      WHERE segments.date DURING LAST_30_DAYS
        AND campaign.status != 'REMOVED'
      ORDER BY metrics.impressions DESC
    `;

    const results = await this.client.query<GoogleAdsCampaignResult>(query);

    return results.map((result) => {
      const impressions = result.metrics?.impressions || 0;
      const clicks = result.metrics?.clicks || 0;
      const costMicros = result.metrics?.cost_micros
        ? Number(result.metrics.cost_micros)
        : 0;
      const cost = costMicros / 1_000_000;
      const conversions = result.metrics?.conversions || 0;

      // Calculate derived metrics
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
      const cpc = clicks > 0 ? cost / clicks : 0;
      const cpa = conversions > 0 ? cost / conversions : 0;

      return {
        id: `google_${result.campaign.id}`,
        name: result.campaign.name,
        platform: "google" as const,
        status: this.mapCampaignStatus(result.campaign.status),
        budget: result.campaign.budget?.amount_micros
          ? Number(result.campaign.budget.amount_micros) / 1_000_000
          : 0,
        impressions,
        clicks,
        cost,
        conversions,
        ctr,
        conversionRate,
        cpc,
        cpa,
        averageCpc: cpc, // same as cpc
        averageCpm: result.metrics?.average_cpm || 0,
        updatedAt: new Date().toISOString(),
      };
    });
  }

  // Toggle campaign status (ON/OFF)
  async toggleCampaignStatus(
    campaignId: string,
    enable: boolean,
  ): Promise<void> {
    const status = enable ? "ENABLED" : "PAUSED";
    const googleCampaignId = campaignId.replace("google_", "");

    const operations = [
      {
        entity: "campaign",
        operation: "update",
        resource: {
          resource_name: `customers/${this.client["credentials"].customerId}/campaigns/${googleCampaignId}`,
          status: status,
        },
        update_mask: {
          paths: ["status"],
        },
      },
    ];

    await this.client.mutate(operations);

    log.info("Campaign status updated", {
      campaignId,
      status,
    });
  }

  // Update campaign budget
  async updateCampaignBudget(
    campaignId: string,
    budgetAmountMicros: number,
  ): Promise<void> {
    const googleCampaignId = campaignId.replace("google_", "");

    // First get the campaign to find its budget ID
    const query = `
      SELECT
        campaign.campaign_budget
      FROM campaign
      WHERE campaign.id = ${googleCampaignId}
    `;

    const [campaign] = await this.client.query<{
      campaign: { campaign_budget: string };
    }>(query);

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    const budgetResourceName = campaign.campaign.campaign_budget;

    const operations = [
      {
        entity: "campaign_budget",
        operation: "update",
        resource: {
          resource_name: budgetResourceName,
          amount_micros: budgetAmountMicros,
        },
        update_mask: {
          paths: ["amount_micros"],
        },
      },
    ];

    await this.client.mutate(operations);

    log.info("Campaign budget updated", {
      campaignId,
      budgetAmountMicros,
    });
  }

  // Get account info
  async getAccountInfo() {
    const query = `
      SELECT
        customer.id,
        customer.descriptive_name,
        customer.currency_code,
        customer.time_zone,
        customer.manager
      FROM customer
      LIMIT 1
    `;

    const [result] = await this.client.query<{
      customer: {
        id: string;
        descriptive_name: string;
        currency_code: string;
        time_zone: string;
        manager: boolean;
      };
    }>(query);

    return result?.customer || null;
  }

  // Get accessible customers (for MCC accounts)
  async getAccessibleCustomers(): Promise<string[]> {
    return this.client.getAccessibleCustomers();
  }

  // Helper to map Google Ads status to our status
  private mapCampaignStatus(
    googleStatus: string,
  ): "active" | "paused" | "removed" {
    switch (googleStatus) {
      case "ENABLED":
        return "active";
      case "PAUSED":
        return "paused";
      case "REMOVED":
        return "removed";
      default:
        return "paused";
    }
  }
}
