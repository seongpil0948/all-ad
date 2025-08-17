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

interface MetaAdAccount {
  id: string;
  name: string;
  currency: string;
  timezone: string;
  status: number;
}

interface MetaAction {
  action_type: string;
  value: string;
}

interface MetaBatchResponse {
  code: number;
  body: string;
}

export class MetaAdsIntegrationService {
  private api: typeof FacebookAdsApi;
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
   * Validate access token using Facebook's debug_token endpoint
   */
  async validateAccessToken(): Promise<{
    isValid: boolean;
    data?: {
      app_id: string;
      user_id: string;
      expires_at: number;
      scopes: string[];
      is_valid: boolean;
    };
    error?: string;
  }> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/debug_token?input_token=${this.credentials.accessToken}&access_token=${this.credentials.accessToken}`,
      );

      const data = await response.json();

      if (data.error) {
        log.error("Token validation failed", data.error);

        return { isValid: false, error: data.error.message };
      }

      const tokenData = data.data;

      return {
        isValid: tokenData.is_valid,
        data: tokenData,
      };
    } catch (error) {
      log.error("Token validation error", error as Error);

      return { isValid: false, error: (error as Error).message };
    }
  }

  /**
   * Exchange short-lived token for long-lived token
   */
  async exchangeForLongLivedToken(shortLivedToken: string): Promise<{
    success: boolean;
    accessToken?: string;
    expiresIn?: number;
    error?: string;
  }> {
    try {
      if (!this.credentials.appId || !this.credentials.appSecret) {
        throw new Error(
          "App ID and App Secret are required for token exchange",
        );
      }

      const params = new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: this.credentials.appId,
        client_secret: this.credentials.appSecret,
        fb_exchange_token: shortLivedToken,
      });

      const response = await fetch(
        "https://graph.facebook.com/v23.0/oauth/access_token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params,
        },
      );

      const data = await response.json();

      if (data.error) {
        log.error("Long-lived token exchange failed", data.error);

        return { success: false, error: data.error.message };
      }

      log.info("Long-lived token exchange successful");

      return {
        success: true,
        accessToken: data.access_token,
        expiresIn: data.expires_in,
      };
    } catch (error) {
      log.error("Long-lived token exchange error", error as Error);

      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get long-lived page access tokens from user token
   */
  async getPageAccessTokens(): Promise<{
    success: boolean;
    pages?: Array<{
      id: string;
      name: string;
      accessToken: string;
      category: string;
      tasks: string[];
    }>;
    error?: string;
  }> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v23.0/me/accounts?access_token=${this.credentials.accessToken}`,
      );

      const data = await response.json();

      if (data.error) {
        log.error("Page access tokens fetch failed", data.error);

        return { success: false, error: data.error.message };
      }

      const pages = data.data.map(
        (page: {
          id: string;
          name: string;
          access_token: string;
          category: string;
          tasks?: string[];
        }) => ({
          id: page.id,
          name: page.name,
          accessToken: page.access_token,
          category: page.category,
          tasks: page.tasks || [],
        }),
      );

      log.info("Page access tokens retrieved", { count: pages.length });

      return { success: true, pages };
    } catch (error) {
      log.error("Page access tokens error", error as Error);

      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Create session info token from long-lived token
   */
  async createSessionInfoToken(): Promise<{
    success: boolean;
    sessionToken?: string;
    expiresIn?: number;
    error?: string;
  }> {
    try {
      if (!this.credentials.appId) {
        throw new Error("App ID is required for session info token");
      }

      const params = new URLSearchParams({
        grant_type: "fb_attenuate_token",
        client_id: this.credentials.appId,
        fb_exchange_token: this.credentials.accessToken,
      });

      const response = await fetch(
        "https://graph.facebook.com/v23.0/oauth/access_token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params,
        },
      );

      const data = await response.json();

      if (data.error) {
        log.error("Session info token creation failed", data.error);

        return { success: false, error: data.error.message };
      }

      log.info("Session info token created successfully");

      return {
        success: true,
        sessionToken: data.access_token,
        expiresIn: data.expires_in,
      };
    } catch (error) {
      log.error("Session info token creation error", error as Error);

      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Auto-refresh token if it's about to expire
   */
  async autoRefreshToken(): Promise<{
    success: boolean;
    newToken?: string;
    error?: string;
  }> {
    try {
      const validation = await this.validateAccessToken();

      if (!validation.isValid || !validation.data) {
        return { success: false, error: "Current token is invalid" };
      }

      // Check if token expires within 24 hours
      const expiresAt = validation.data.expires_at * 1000; // Convert to milliseconds
      const now = Date.now();
      const hoursUntilExpiry = (expiresAt - now) / (1000 * 60 * 60);

      if (hoursUntilExpiry > 24) {
        log.info("Token is still valid, no refresh needed", {
          hoursUntilExpiry: Math.round(hoursUntilExpiry),
        });

        return { success: true };
      }

      // Token is expiring soon, exchange for new long-lived token
      const exchange = await this.exchangeForLongLivedToken(
        this.credentials.accessToken,
      );

      if (!exchange.success) {
        return { success: false, error: exchange.error };
      }

      log.info("Token auto-refreshed successfully");

      return { success: true, newToken: exchange.accessToken };
    } catch (error) {
      log.error("Auto token refresh error", error as Error);

      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get all accessible ad accounts with caching
   */
  async getAdAccounts(businessId?: string): Promise<MetaAdAccount[]> {
    // Check cache first
    const cacheKey = `accounts:${businessId || "user"}`;
    const cached = await this.getCachedData<MetaAdAccount[]>(cacheKey);

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
   * Get campaign insights (metrics) with multiple date range support
   */
  async getCampaignInsights(
    accountId: string,
    campaignId?: string,
    dateRange: string = "last_30d",
  ): Promise<
    Array<{
      impressions: string;
      clicks: string;
      spend: string;
      actions?: Array<{ action_type: string; value: string }>;
      ctr: string;
      cpc: string;
      cpm: string;
      reach?: string;
      frequency?: string;
      date_start: string;
      date_stop: string;
      campaign_id?: string;
      campaign_name?: string;
    }>
  > {
    const cacheKey = `insights:${accountId}:${campaignId || "all"}:${dateRange}`;
    const cached = await this.getCachedData<
      Array<{
        impressions: string;
        clicks: string;
        spend: string;
        actions?: Array<{ action_type: string; value: string }>;
        ctr: string;
        cpc: string;
        cpm: string;
        reach?: string;
        frequency?: string;
        date_start: string;
        date_stop: string;
        campaign_id?: string;
        campaign_name?: string;
      }>
    >(cacheKey);

    if (cached) {
      log.info("Returning cached insights", {
        accountId,
        campaignId,
        dateRange,
      });

      return cached;
    }

    try {
      let insights;

      if (campaignId) {
        // Get insights for specific campaign
        const campaign = new Campaign(campaignId);

        insights = await campaign.getInsights(this.defaultFields.insights, {
          time_range: this.convertDateRange(dateRange),
          level: "campaign",
        });
      } else {
        // Get insights for all campaigns in account
        const account = new AdAccount(`act_${accountId}`);

        insights = await account.getInsights(this.defaultFields.insights, {
          time_range: this.convertDateRange(dateRange),
          level: "campaign",
        });
      }

      const insightData = [];

      for await (const insight of insights) {
        insightData.push({
          impressions: insight.impressions || "0",
          clicks: insight.clicks || "0",
          spend: insight.spend || "0",
          actions: insight.actions || [],
          ctr: insight.ctr || "0",
          cpc: insight.cpc || "0",
          cpm: insight.cpm || "0",
          reach: insight.reach || "0",
          frequency: insight.frequency || "0",
          date_start: insight.date_start || "",
          date_stop: insight.date_stop || "",
          campaign_id: insight.campaign_id || campaignId,
          campaign_name: insight.campaign_name || "",
        });
      }

      // Cache the results
      await this.setCachedData(cacheKey, insightData);

      return insightData;
    } catch (error) {
      log.error("Failed to fetch campaign insights", error as Error);
      throw error;
    }
  }

  /**
   * Get account-level insights
   */
  async getAccountInsights(
    accountId: string,
    dateRange: string = "last_30d",
  ): Promise<{
    impressions: string;
    clicks: string;
    spend: string;
    actions?: Array<{ action_type: string; value: string }>;
    ctr: string;
    cpc: string;
    cpm: string;
    reach?: string;
    frequency?: string;
    date_start: string;
    date_stop: string;
  }> {
    const cacheKey = `account_insights:${accountId}:${dateRange}`;
    const cached = await this.getCachedData<{
      impressions: string;
      clicks: string;
      spend: string;
      actions?: Array<{ action_type: string; value: string }>;
      ctr: string;
      cpc: string;
      cpm: string;
      reach?: string;
      frequency?: string;
      date_start: string;
      date_stop: string;
    }>(cacheKey);

    if (cached) {
      log.info("Returning cached account insights", { accountId, dateRange });

      return cached;
    }

    try {
      const account = new AdAccount(`act_${accountId}`);
      const insights = await account.getInsights(this.defaultFields.insights, {
        time_range: this.convertDateRange(dateRange),
        level: "account",
      });

      let accountInsight = {
        impressions: "0",
        clicks: "0",
        spend: "0",
        actions: [],
        ctr: "0",
        cpc: "0",
        cpm: "0",
        reach: "0",
        frequency: "0",
        date_start: "",
        date_stop: "",
      };

      for await (const insight of insights) {
        accountInsight = {
          impressions: insight.impressions || "0",
          clicks: insight.clicks || "0",
          spend: insight.spend || "0",
          actions: insight.actions || [],
          ctr: insight.ctr || "0",
          cpc: insight.cpc || "0",
          cpm: insight.cpm || "0",
          reach: insight.reach || "0",
          frequency: insight.frequency || "0",
          date_start: insight.date_start || "",
          date_stop: insight.date_stop || "",
        };
        break; // Account level returns single result
      }

      // Cache the results
      await this.setCachedData(cacheKey, accountInsight);

      return accountInsight;
    } catch (error) {
      log.error("Failed to fetch account insights", error as Error);
      throw error;
    }
  }

  /**
   * Convert date range string to Meta Ads API format
   */
  private convertDateRange(dateRange: string): {
    since: string;
    until: string;
  } {
    const today = new Date();
    const endDate = new Date(today);
    let startDate = new Date(today);

    switch (dateRange) {
      case "today":
        // Today only
        break;
      case "yesterday":
        startDate.setDate(today.getDate() - 1);
        endDate.setDate(today.getDate() - 1);
        break;
      case "last_7d":
      case "last_7_days":
        startDate.setDate(today.getDate() - 7);
        break;
      case "last_14d":
      case "last_14_days":
        startDate.setDate(today.getDate() - 14);
        break;
      case "last_30d":
      case "last_30_days":
      default:
        startDate.setDate(today.getDate() - 30);
        break;
      case "last_90d":
      case "last_90_days":
        startDate.setDate(today.getDate() - 90);
        break;
      case "this_month":
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case "last_month":
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate.setDate(0); // Last day of previous month
        break;
    }

    return {
      since: startDate.toISOString().split("T")[0],
      until: endDate.toISOString().split("T")[0],
    };
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
  private extractConversions(actions?: MetaAction[]): number {
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

      // Convert date range for insights
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      const daysDiff = Math.ceil(
        (endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24),
      );

      let dateRange = "last_30d";

      if (daysDiff <= 1) dateRange = "today";
      else if (daysDiff <= 7) dateRange = "last_7d";
      else if (daysDiff <= 14) dateRange = "last_14d";
      else if (daysDiff <= 90) dateRange = "last_90d";

      // Fetch insights for all campaigns in parallel
      const campaignsWithInsights = await Promise.all(
        campaigns.map(async (campaign) => {
          try {
            const insights = await this.getCampaignInsights(
              accountId,
              campaign.id,
              dateRange,
            );

            const insightData =
              insights && insights.length > 0 ? insights[0] : null;

            return {
              ...campaign,
              metrics: insightData
                ? {
                    impressions: parseInt(insightData.impressions || "0"),
                    clicks: parseInt(insightData.clicks || "0"),
                    spend: parseFloat(insightData.spend || "0"),
                    conversions: this.extractConversions(insightData.actions),
                    ctr: parseFloat(insightData.ctr || "0") / 100,
                    cpc: parseFloat(insightData.cpc || "0"),
                  }
                : undefined,
            };
          } catch (error) {
            log.warn(`Failed to fetch insights for campaign ${campaign.id}`, {
              error: (error as Error).message,
              campaignId: campaign.id,
            });

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
      log.warn("Cache read error", { key, error: (error as Error).message });
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
      log.warn("Cache write error", { key, error: (error as Error).message });
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
          response.forEach((result: MetaBatchResponse, index: number) => {
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
