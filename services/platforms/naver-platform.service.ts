import { BasePlatformService } from "./base-platform.service";
import {
  ConnectionTestResult,
  TokenRefreshResult,
} from "./platform-service.interface";

import {
  Campaign,
  CampaignMetrics,
  NaverCredentials,
  PlatformType,
} from "@/types";
import log from "@/utils/logger";

export class NaverPlatformService extends BasePlatformService {
  platform: PlatformType = "naver";

  async testConnection(): Promise<ConnectionTestResult> {
    return this.executeWithErrorHandling(async () => {
      // Test Naver Search Ad API connection
      if (!this.credentials?.accessToken) {
        return {
          success: false,
          error: "Access token not found",
        };
      }

      try {
        // Test with a simple API call to get account info
        const response = await fetch("https://ncc.naver.com/api/v1/account", {
          headers: {
            Authorization: `Bearer ${this.credentials.accessToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          return {
            success: false,
            error: `Naver API error: ${response.status}`,
          };
        }

        const data = await response.json();

        return {
          success: true,
          accountInfo: {
            id: data.id || "naver-account",
            name: data.name || "Naver Search Ad Account",
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Connection failed",
        };
      }
    }, "testConnection");
  }

  async refreshToken(): Promise<TokenRefreshResult> {
    return this.executeWithErrorHandling(async () => {
      // Naver uses API key authentication, no token refresh needed
      // But we should validate the API key is still valid
      const isValid = await this.validateCredentials();

      return {
        success: isValid,
        accessToken: this.credentials?.accessToken || "",
        message: isValid ? "API key is valid" : "API key validation failed",
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
        id: "naver-account",
        name: "Naver Search Ad Account",
        currency: "KRW",
        timezone: "Asia/Seoul",
      };
    }, "getAccountInfo");
  }

  async validateCredentials(): Promise<boolean> {
    const { apiKey, apiSecret, customerId } = this
      .credentials as unknown as NaverCredentials;

    if (!apiKey || !apiSecret || !customerId) {
      return false;
    }

    try {
      // Validate credentials by making a test API call
      const response = await fetch("https://ncc.naver.com/api/v1/account", {
        headers: {
          "X-API-KEY": apiKey,
          "X-API-SECRET": apiSecret,
          "X-CUSTOMER-ID": customerId,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        log.warn("Naver API validation failed", {
          status: response.status,
          customerId,
        });

        return false;
      }

      const data = await response.json();

      // Check if the response contains valid account data
      if (data && data.id) {
        log.info("Naver credentials validated successfully", {
          customerId,
          accountId: data.id,
        });

        return true;
      }

      return false;
    } catch (error) {
      log.error("Naver credentials validation error", error);

      return false;
    }
  }

  async fetchCampaigns(): Promise<Campaign[]> {
    return this.executeWithErrorHandling(async () => {
      log.info("Fetching Naver campaigns");

      const { apiKey, apiSecret, customerId } = this
        .credentials as unknown as NaverCredentials;

      if (!apiKey || !apiSecret || !customerId) {
        throw new Error("Naver credentials not found");
      }

      try {
        // Create authentication header
        const timestamp = Date.now().toString();
        const signature = await this.generateSignature(
          apiKey,
          apiSecret,
          timestamp,
        );

        const headers = {
          "X-Timestamp": timestamp,
          "X-API-KEY": apiKey,
          "X-Customer": customerId,
          "X-Signature": signature,
          "Content-Type": "application/json",
        };

        // Fetch campaigns from Naver Search Ad API
        const response = await fetch(
          `https://api.searchad.naver.com/customers/${customerId}/campaigns`,
          {
            method: "GET",
            headers,
          },
        );

        if (!response.ok) {
          throw new Error(
            `Naver API error: ${response.status} ${response.statusText}`,
          );
        }

        const data = await response.json();

        // Transform Naver campaigns to our Campaign format
        const campaigns: Campaign[] = data.map(
          (naverCampaign: Record<string, unknown>) => ({
            id: naverCampaign.nccCampaignId,
            team_id: this.credentials?.team_id,
            platform: "naver" as const,
            platform_campaign_id: naverCampaign.nccCampaignId,
            name: naverCampaign.name,
            status: naverCampaign.status,
            budget: naverCampaign.dailyBudget,
            is_active: naverCampaign.status === "ELIGIBLE",
            raw_data: naverCampaign,
            synced_at: new Date().toISOString(),
          }),
        );

        log.info("Naver campaigns fetched successfully", {
          count: campaigns.length,
        });

        return campaigns;
      } catch (error) {
        log.error("Error fetching Naver campaigns:", error);
        throw error;
      }
    }, "fetchCampaigns");
  }

  // Generate signature for Naver Search Ad API authentication
  private async generateSignature(
    apiKey: string,
    apiSecret: string,
    timestamp: string,
  ): Promise<string> {
    const crypto = await import("crypto");
    const method = "GET";
    const uri = "/customers";
    const signature = `${timestamp}.${method}.${uri}`;

    return crypto
      .createHmac("sha256", apiSecret)
      .update(signature)
      .digest("base64");
  }

  async fetchCampaignMetrics(
    campaignId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CampaignMetrics[]> {
    return this.executeWithErrorHandling(async () => {
      log.info("Fetching Naver campaign metrics", {
        campaignId,
        startDate,
        endDate,
      });

      const { apiKey, apiSecret, customerId } = this
        .credentials as unknown as NaverCredentials;

      if (!apiKey || !apiSecret || !customerId) {
        throw new Error("Naver credentials not found");
      }

      try {
        // Format dates for Naver API (YYYY-MM-DD)
        const formatDate = (date: Date) => date.toISOString().split("T")[0];
        const startDateStr = formatDate(startDate);
        const endDateStr = formatDate(endDate);

        // Get campaign metrics from Naver Search Ad API
        const response = await fetch(
          `https://ncc.naver.com/api/v1/campaigns/${campaignId}/metrics?start_date=${startDateStr}&end_date=${endDateStr}`,
          {
            headers: {
              "X-API-KEY": apiKey,
              "X-API-SECRET": apiSecret,
              "X-CUSTOMER-ID": customerId,
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error(`Naver API error: ${response.status}`);
        }

        const data = await response.json();

        // Transform Naver metrics data to our format
        return (data.metrics || []).map((metric: Record<string, unknown>) => ({
          campaign_id: campaignId,
          team_id: this.teamId || "",
          platform: "naver" as PlatformType,
          date: String(metric.date || startDateStr),
          impressions: Number(metric.impressions) || 0,
          clicks: Number(metric.clicks) || 0,
          conversions: Number(metric.conversions) || 0,
          cost: Number(metric.cost) || 0,
          revenue: Number(metric.revenue) || 0,
          ctr: Number(metric.ctr) || 0,
          cpc: Number(metric.cpc) || 0,
          cpm: Number(metric.cpm) || 0,
          roas: Number(metric.roas) || 0,
          roi: Number(metric.roi) || 0,
          raw_data: metric,
          created_at: new Date().toISOString(),
        }));
      } catch (error) {
        log.error("Failed to fetch Naver campaign metrics", error);
        throw error;
      }
    }, "fetchCampaignMetrics");
  }

  async updateCampaignBudget(
    campaignId: string,
    budget: number,
  ): Promise<boolean> {
    return this.executeWithErrorHandling(async () => {
      log.info("Updating Naver campaign budget", {
        campaignId,
        budget,
      });

      const { apiKey, apiSecret, customerId } = this
        .credentials as unknown as NaverCredentials;

      if (!apiKey || !apiSecret || !customerId) {
        throw new Error("Naver credentials not found");
      }

      try {
        // Update campaign budget via Naver Search Ad API
        const response = await fetch(
          `https://ncc.naver.com/api/v1/campaigns/${campaignId}`,
          {
            method: "PUT",
            headers: {
              "X-API-KEY": apiKey,
              "X-API-SECRET": apiSecret,
              "X-CUSTOMER-ID": customerId,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              budget: budget,
            }),
          },
        );

        if (!response.ok) {
          throw new Error(`Naver API error: ${response.status}`);
        }

        log.info("Naver campaign budget updated successfully", {
          campaignId,
          budget,
        });

        return true;
      } catch (error) {
        log.error("Failed to update Naver campaign budget", error);
        throw error;
      }
    }, "updateCampaignBudget");
  }

  async updateCampaignStatus(
    campaignId: string,
    isActive: boolean,
  ): Promise<boolean> {
    return this.executeWithErrorHandling(async () => {
      log.info("Updating Naver campaign status", {
        campaignId,
        isActive,
      });

      const { apiKey, apiSecret, customerId } = this
        .credentials as unknown as NaverCredentials;

      if (!apiKey || !apiSecret || !customerId) {
        throw new Error("Naver credentials not found");
      }

      try {
        // Map our boolean to Naver's status values
        const naverStatus = isActive ? "ACTIVE" : "PAUSED";

        // Update campaign status via Naver Search Ad API
        const response = await fetch(
          `https://ncc.naver.com/api/v1/campaigns/${campaignId}`,
          {
            method: "PUT",
            headers: {
              "X-API-KEY": apiKey,
              "X-API-SECRET": apiSecret,
              "X-CUSTOMER-ID": customerId,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: naverStatus,
            }),
          },
        );

        if (!response.ok) {
          throw new Error(`Naver API error: ${response.status}`);
        }

        log.info("Naver campaign status updated successfully", {
          campaignId,
          status: naverStatus,
        });

        return true;
      } catch (error) {
        log.error("Failed to update Naver campaign status", error);
        throw error;
      }
    }, "updateCampaignStatus");
  }
}
