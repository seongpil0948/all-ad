// Using require as per SDK documentation

import crypto from "crypto";

import log from "@/utils/logger";
import { getRedisClient } from "@/lib/redis";

const adsSdk = require("facebook-nodejs-business-sdk");

const { AdAccount, Campaign, Business, AdsInsights, FacebookAdsApi, User } =
  adsSdk;

export interface MetaAdsCredentials {
  accessToken: string;
  appId?: string;
  appSecret?: string;
  businessId?: string;
  systemUserId?: string;
}

export interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective?: string;
  dailyBudget?: number;
  lifetimeBudget?: number;
  metrics?: {
    impressions?: number;
    clicks?: number;
    spend?: number;
    conversions?: number;
    ctr?: number;
    cpc?: number;
  };
}

export class MetaAdsIntegrationService {
  private api: any;
  private credentials: MetaAdsCredentials;
  private cacheKeyPrefix = "meta_ads:";
  private cacheTTL = 24 * 60 * 60; // 24 hours as per documentation

  // Using SDK Field enums as per documentation
  private defaultFields = {
    campaign: [
      Campaign.Fields.id,
      Campaign.Fields.name,
      Campaign.Fields.status,
      Campaign.Fields.objective,
      Campaign.Fields.daily_budget,
      Campaign.Fields.lifetime_budget,
      Campaign.Fields.created_time,
      Campaign.Fields.updated_time,
    ],
    insights: [
      AdsInsights.Fields.impressions,
      AdsInsights.Fields.clicks,
      AdsInsights.Fields.spend,
      AdsInsights.Fields.actions,
      AdsInsights.Fields.ctr,
      AdsInsights.Fields.cpc,
      AdsInsights.Fields.reach,
      AdsInsights.Fields.frequency,
    ],
    adAccount: [
      AdAccount.Fields.id,
      AdAccount.Fields.name,
      AdAccount.Fields.currency,
      AdAccount.Fields.timezone_name,
      AdAccount.Fields.account_status,
      AdAccount.Fields.business,
      AdAccount.Fields.spend_cap,
    ],
  };

  constructor(credentials: MetaAdsCredentials) {
    this.credentials = credentials;

    // Initialize the SDK as per documentation
    this.api = FacebookAdsApi.init(credentials.accessToken);

    // Enable debug mode in development
    if (process.env.NODE_ENV === "development") {
      this.api.setDebug(true);
    }

    // App Secret Proof for security (recommended in docs)
    if (credentials.appSecret && credentials.appId) {
      const appSecretProof = this.generateAppSecretProof(
        credentials.accessToken,
        credentials.appSecret,
      );

      this.api.setAppSecretProof(appSecretProof);
    }
  }

  /**
   * Test connection to Meta Ads API
   */
  async testConnection(accountId: string): Promise<boolean> {
    try {
      const account = new AdAccount(`act_${accountId}`);

      await account.read(["id", "name"]);
      log.info("Meta Ads API connection successful", { accountId });

      return true;
    } catch (error) {
      log.error("Meta Ads API connection failed", error as Error);

      return false;
    }
  }

  /**
   * Get all accessible ad accounts with caching
   */
  async getAdAccounts(businessId?: string): Promise<any[]> {
    // Check cache first
    const cacheKey = `accounts:${businessId || "user"}`;
    const cached = await this.getCachedData<any[]>(cacheKey);

    if (cached) {
      log.info("Returning cached ad accounts", { count: cached.length });

      return cached;
    }

    try {
      const accounts = [];

      if (businessId) {
        // Get accounts from business
        const business = new Business(businessId);
        const adAccounts = await business.getOwnedAdAccounts([
          "id",
          "name",
          "currency",
          "timezone_name",
          "account_status",
        ]);

        for await (const account of adAccounts) {
          accounts.push({
            id: account.id.replace("act_", ""),
            name: account.name,
            currency: account.currency,
            timezone: account.timezone_name,
            status: account.account_status,
          });
        }
      } else {
        // Get accounts accessible by the user
        const me = new User("me");
        const adAccounts = await me.getAdAccounts([
          "id",
          "name",
          "currency",
          "timezone_name",
          "account_status",
        ]);

        for await (const account of adAccounts) {
          accounts.push({
            id: account.id.replace("act_", ""),
            name: account.name,
            currency: account.currency,
            timezone: account.timezone_name,
            status: account.account_status,
          });
        }
      }

      log.info("Fetched Meta ad accounts", { count: accounts.length });

      // Cache the results
      await this.setCachedData(cacheKey, accounts);

      return accounts;
    } catch (error) {
      log.error("Failed to fetch ad accounts", error as Error);
      throw error;
    }
  }

  /**
   * Get campaigns from an ad account with caching and cursor pagination
   */
  async getCampaigns(accountId: string): Promise<MetaCampaign[]> {
    // Check cache first
    const cacheKey = `campaigns:${accountId}`;
    const cached = await this.getCachedData<MetaCampaign[]>(cacheKey);

    if (cached) {
      log.info("Returning cached campaigns", {
        accountId,
        count: cached.length,
      });

      return cached;
    }

    try {
      const account = new AdAccount(`act_${accountId}`);
      const campaignList: MetaCampaign[] = [];

      // Use cursor-based pagination as per SDK documentation
      let campaigns = await account.getCampaigns(this.defaultFields.campaign, {
        limit: 50, // Optimal batch size
      });

      // Process initial batch
      for (const campaign of campaigns) {
        campaignList.push({
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          objective: campaign.objective,
          dailyBudget: campaign.daily_budget
            ? parseInt(campaign.daily_budget) / 100
            : undefined,
          lifetimeBudget: campaign.lifetime_budget
            ? parseInt(campaign.lifetime_budget) / 100
            : undefined,
        });
      }

      // Handle pagination with cursor
      while (campaigns.hasNext()) {
        campaigns = await campaigns.next();
        for (const campaign of campaigns) {
          campaignList.push({
            id: campaign.id,
            name: campaign.name,
            status: campaign.status,
            objective: campaign.objective,
            dailyBudget: campaign.daily_budget
              ? parseInt(campaign.daily_budget) / 100
              : undefined,
            lifetimeBudget: campaign.lifetime_budget
              ? parseInt(campaign.lifetime_budget) / 100
              : undefined,
          });
        }
      }

      log.info("Fetched Meta campaigns", {
        accountId,
        count: campaignList.length,
      });

      // Cache the results
      await this.setCachedData(cacheKey, campaignList);

      return campaignList;
    } catch (error) {
      log.error("Failed to fetch campaigns", error as Error);
      throw error;
    }
  }

  /**
   * Get campaign insights (metrics)
   */
  async getCampaignInsights(
    campaignId: string,
    startDate: string,
    endDate: string,
  ): Promise<any> {
    try {
      const campaign = new Campaign(campaignId);
      const insights = await campaign.getInsights(this.defaultFields.insights, {
        time_range: {
          since: startDate,
          until: endDate,
        },
        level: "campaign",
      });

      const insightData = [];

      for await (const insight of insights) {
        insightData.push({
          campaignId,
          impressions: parseInt(insight.impressions || "0"),
          clicks: parseInt(insight.clicks || "0"),
          spend: parseFloat(insight.spend || "0"),
          ctr: parseFloat(insight.ctr || "0"),
          cpc: parseFloat(insight.cpc || "0"),
          conversions: this.extractConversions(insight.actions),
        });
      }

      return insightData[0] || null;
    } catch (error) {
      log.error("Failed to fetch campaign insights", error as Error);
      throw error;
    }
  }

  /**
   * Update campaign status
   */
  async updateCampaignStatus(
    campaignId: string,
    status: "ACTIVE" | "PAUSED",
  ): Promise<boolean> {
    try {
      const campaign = new Campaign(campaignId);

      await campaign.update([], { status });

      log.info("Updated campaign status", { campaignId, status });

      return true;
    } catch (error) {
      log.error("Failed to update campaign status", error as Error);

      return false;
    }
  }

  /**
   * Update campaign budget
   */
  async updateCampaignBudget(
    campaignId: string,
    dailyBudget: number,
  ): Promise<boolean> {
    try {
      const campaign = new Campaign(campaignId);

      await campaign.update([], {
        daily_budget: Math.round(dailyBudget * 100), // Convert to cents
      });

      log.info("Updated campaign budget", { campaignId, dailyBudget });

      return true;
    } catch (error) {
      log.error("Failed to update campaign budget", error as Error);

      return false;
    }
  }

  /**
   * Create a new campaign
   */
  async createCampaign(
    accountId: string,
    campaignData: {
      name: string;
      objective: string;
      dailyBudget: number;
      status?: string;
    },
  ): Promise<string> {
    try {
      const account = new AdAccount(`act_${accountId}`);

      const campaign = await account.createCampaign(["id"], {
        name: campaignData.name,
        objective: campaignData.objective,
        status: campaignData.status || Campaign.Status.paused,
        daily_budget: Math.round(campaignData.dailyBudget * 100),
        special_ad_categories: [], // Required field
      });

      log.info("Created new campaign", { campaignId: campaign.id });

      return campaign.id;
    } catch (error) {
      log.error("Failed to create campaign", error as Error);
      throw error;
    }
  }

  /**
   * Helper method to extract conversions from actions array
   */
  private extractConversions(actions?: any[]): number {
    if (!actions || !Array.isArray(actions)) return 0;

    const conversionActions = [
      "purchase",
      "lead",
      "complete_registration",
      "add_to_cart",
      "initiate_checkout",
    ];

    let totalConversions = 0;

    for (const action of actions) {
      if (conversionActions.includes(action.action_type)) {
        totalConversions += parseInt(action.value || "0");
      }
    }

    return totalConversions;
  }

  /**
   * Batch get campaigns with insights
   */
  async getCampaignsWithInsights(
    accountId: string,
    startDate: string,
    endDate: string,
  ): Promise<MetaCampaign[]> {
    try {
      const campaigns = await this.getCampaigns(accountId);

      // Fetch insights for all campaigns in parallel
      const campaignsWithInsights = await Promise.all(
        campaigns.map(async (campaign) => {
          try {
            const insights = await this.getCampaignInsights(
              campaign.id,
              startDate,
              endDate,
            );

            return {
              ...campaign,
              metrics: insights
                ? {
                    impressions: insights.impressions,
                    clicks: insights.clicks,
                    spend: insights.spend,
                    conversions: insights.conversions,
                    ctr: insights.ctr,
                    cpc: insights.cpc,
                  }
                : undefined,
            };
          } catch (error) {
            log.warn(
              `Failed to fetch insights for campaign ${campaign.id}`,
              error as Error,
            );

            return campaign;
          }
        }),
      );

      return campaignsWithInsights;
    } catch (error) {
      log.error("Failed to fetch campaigns with insights", error as Error);
      throw error;
    }
  }

  /**
   * Generate App Secret Proof for enhanced security
   * As per Facebook documentation requirements
   */
  private generateAppSecretProof(
    accessToken: string,
    appSecret: string,
  ): string {
    return crypto
      .createHmac("sha256", appSecret)
      .update(accessToken)
      .digest("hex");
  }

  /**
   * Get cached data with Redis
   */
  private async getCachedData<T>(key: string): Promise<T | null> {
    try {
      const redis = await getRedisClient();
      const cached = await redis.get(`${this.cacheKeyPrefix}${key}`);

      if (cached) {
        return JSON.parse(cached) as T;
      }
    } catch (error) {
      log.warn("Cache read error", { key, error });
    }

    return null;
  }

  /**
   * Set cached data with Redis
   */
  private async setCachedData<T>(
    key: string,
    data: T,
    ttl: number = this.cacheTTL,
  ): Promise<void> {
    try {
      const redis = await getRedisClient();

      await redis.setEx(
        `${this.cacheKeyPrefix}${key}`,
        ttl,
        JSON.stringify(data),
      );
    } catch (error) {
      log.warn("Cache write error", { key, error });
    }
  }

  /**
   * Batch update campaign statuses
   * Uses Facebook Batch API for efficiency
   */
  async batchUpdateCampaignStatus(
    updates: Array<{ campaignId: string; status: "ACTIVE" | "PAUSED" }>,
  ): Promise<{ successful: string[]; failed: string[] }> {
    try {
      const results: { successful: string[]; failed: string[] } = {
        successful: [],
        failed: [],
      };

      // Facebook Batch API supports up to 50 requests
      const batchSize = 50;
      const batches = [];

      for (let i = 0; i < updates.length; i += batchSize) {
        batches.push(updates.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        const batchRequests = batch.map((update) => ({
          method: "POST",
          relative_url: `${update.campaignId}`,
          body: `status=${update.status}`,
        }));

        try {
          // Execute batch request
          const response = await this.api.call("POST", "/", {
            batch: JSON.stringify(batchRequests),
          });

          // Process batch response
          response.forEach((result: any, index: number) => {
            if (result.code === 200) {
              results.successful.push(batch[index].campaignId);
            } else {
              results.failed.push(batch[index].campaignId);
              log.error("Batch update failed for campaign", {
                campaignId: batch[index].campaignId,
                error: result.body,
              });
            }
          });
        } catch (error) {
          // If batch fails, add all to failed
          batch.forEach((update) => results.failed.push(update.campaignId));
          log.error("Batch request failed", error as Error);
        }
      }

      return results;
    } catch (error) {
      log.error("Batch update campaign status failed", error as Error);
      throw error;
    }
  }

  /**
   * Clear cache for specific keys or patterns
   */
  async clearCache(pattern?: string): Promise<void> {
    try {
      const redis = await getRedisClient();

      if (pattern) {
        const keys = await redis.keys(`${this.cacheKeyPrefix}${pattern}*`);

        if (keys.length > 0) {
          await redis.del(keys);
          log.info(`Cleared ${keys.length} cache entries`);
        }
      } else {
        // Clear all Meta Ads cache
        const keys = await redis.keys(`${this.cacheKeyPrefix}*`);

        if (keys.length > 0) {
          await redis.del(keys);
          log.info(`Cleared all Meta Ads cache (${keys.length} entries)`);
        }
      }
    } catch (error) {
      log.error("Cache clear error", error as Error);
    }
  }
}
