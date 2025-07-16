import { BasePlatformService } from "./base-platform.service";
import {
  ConnectionTestResult,
  TokenRefreshResult,
} from "./platform-service.interface";

import {
  Campaign,
  CampaignMetrics,
  KakaoCredentials,
  PlatformType,
} from "@/types";
import log from "@/utils/logger";

export class KakaoPlatformService extends BasePlatformService {
  platform: PlatformType = "kakao";

  async testConnection(): Promise<ConnectionTestResult> {
    return this.executeWithErrorHandling(async () => {
      // Test Kakao Moment API connection
      if (!this.credentials?.accessToken) {
        return {
          success: false,
          error: "Access token not found",
        };
      }

      try {
        // Test with a simple API call to get account info
        const response = await fetch(
          "https://apis.moment.kakao.com/openapi/v4/advertiser",
          {
            headers: {
              Authorization: `Bearer ${this.credentials.accessToken}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          return {
            success: false,
            error: `Kakao API error: ${response.status}`,
          };
        }

        const data = await response.json();

        return {
          success: true,
          accountInfo: {
            id: data.id || "kakao-account",
            name: data.name || "Kakao Moment Account",
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
      // Kakao tokens need to be refreshed using refresh_token
      if (!this.credentials?.refreshToken) {
        return {
          success: false,
          error: "Refresh token not found",
        };
      }

      try {
        const response = await fetch("https://kauth.kakao.com/oauth/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            client_id: process.env.KAKAO_CLIENT_ID || "",
            client_secret: process.env.KAKAO_CLIENT_SECRET || "",
            refresh_token: this.credentials.refreshToken,
          }),
        });

        if (!response.ok) {
          return {
            success: false,
            error: `Kakao token refresh failed: ${response.status}`,
          };
        }

        const tokenData = await response.json();

        return {
          success: true,
          accessToken: tokenData.access_token,
          refreshToken:
            tokenData.refresh_token || this.credentials.refreshToken,
        };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Token refresh failed",
        };
      }
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
        id: "kakao-account",
        name: "Kakao Moment Account",
        currency: "KRW",
        timezone: "Asia/Seoul",
      };
    }, "getAccountInfo");
  }

  async validateCredentials(): Promise<boolean> {
    const { accessToken, accountId } = this
      .credentials as unknown as KakaoCredentials;

    if (!accessToken || !accountId) {
      return false;
    }

    // Validate credentials by testing API connection
    try {
      const response = await fetch(
        "https://apis.moment.kakao.com/openapi/v4/advertiser",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      return response.ok;
    } catch (error) {
      log.error("Kakao credentials validation failed", error);

      return false;
    }
  }

  async fetchCampaigns(): Promise<Campaign[]> {
    return this.executeWithErrorHandling(async () => {
      log.info("Fetching Kakao campaigns");

      if (!this.credentials?.accessToken) {
        throw new Error("Access token not found");
      }

      try {
        // Get campaigns from Kakao Moment API
        const response = await fetch(
          "https://apis.moment.kakao.com/openapi/v4/campaigns",
          {
            headers: {
              Authorization: `Bearer ${this.credentials.accessToken}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error(`Kakao API error: ${response.status}`);
        }

        const data = await response.json();

        // Transform Kakao campaign data to our format
        return (data.campaigns || []).map(
          (campaign: Record<string, unknown>) => ({
            id: String(campaign.id || ""),
            team_id: this.teamId || "",
            platform: "kakao" as PlatformType,
            platform_campaign_id: String(campaign.id || ""),
            name: String(campaign.name || "Untitled Campaign"),
            status: String(campaign.status) === "ACTIVE" ? "active" : "paused",
            is_active: String(campaign.status) === "ACTIVE",
            budget: Number(campaign.budget) || 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }),
        );
      } catch (error) {
        log.error("Failed to fetch Kakao campaigns", error);
        throw error;
      }
    }, "fetchCampaigns");
  }

  async fetchCampaignMetrics(
    campaignId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CampaignMetrics[]> {
    return this.executeWithErrorHandling(async () => {
      log.info("Fetching Kakao campaign metrics", {
        campaignId,
        startDate,
        endDate,
      });

      if (!this.credentials?.accessToken) {
        throw new Error("Access token not found");
      }

      try {
        // Format dates for Kakao API (YYYY-MM-DD)
        const formatDate = (date: Date) => date.toISOString().split("T")[0];
        const startDateStr = formatDate(startDate);
        const endDateStr = formatDate(endDate);

        // Get campaign metrics from Kakao Moment API
        const response = await fetch(
          `https://apis.moment.kakao.com/openapi/v4/campaigns/${campaignId}/metrics?start_date=${startDateStr}&end_date=${endDateStr}`,
          {
            headers: {
              Authorization: `Bearer ${this.credentials.accessToken}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error(`Kakao API error: ${response.status}`);
        }

        const data = await response.json();

        // Transform Kakao metrics data to our format
        return (data.metrics || []).map((metric: Record<string, unknown>) => ({
          campaign_id: campaignId,
          team_id: this.teamId || "",
          platform: "kakao" as PlatformType,
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
        log.error("Failed to fetch Kakao campaign metrics", error);
        throw error;
      }
    }, "fetchCampaignMetrics");
  }

  async updateCampaignBudget(
    campaignId: string,
    budget: number,
  ): Promise<boolean> {
    return this.executeWithErrorHandling(async () => {
      log.info("Updating Kakao campaign budget", {
        campaignId,
        budget,
      });

      if (!this.credentials?.accessToken) {
        throw new Error("Access token not found");
      }

      try {
        // Update campaign budget via Kakao Moment API
        const response = await fetch(
          `https://apis.moment.kakao.com/openapi/v4/campaigns/${campaignId}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${this.credentials.accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              budget: budget,
            }),
          },
        );

        if (!response.ok) {
          throw new Error(`Kakao API error: ${response.status}`);
        }

        log.info("Kakao campaign budget updated successfully", {
          campaignId,
          budget,
        });

        return true;
      } catch (error) {
        log.error("Failed to update Kakao campaign budget", error);
        throw error;
      }
    }, "updateCampaignBudget");
  }

  async updateCampaignStatus(
    campaignId: string,
    isActive: boolean,
  ): Promise<boolean> {
    return this.executeWithErrorHandling(async () => {
      log.info("Updating Kakao campaign status", {
        campaignId,
        isActive,
      });

      if (!this.credentials?.accessToken) {
        throw new Error("Access token not found");
      }

      try {
        // Map our boolean to Kakao's status values
        const kakaoStatus = isActive ? "ACTIVE" : "PAUSED";

        // Update campaign status via Kakao Moment API
        const response = await fetch(
          `https://apis.moment.kakao.com/openapi/v4/campaigns/${campaignId}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${this.credentials.accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: kakaoStatus,
            }),
          },
        );

        if (!response.ok) {
          throw new Error(`Kakao API error: ${response.status}`);
        }

        log.info("Kakao campaign status updated successfully", {
          campaignId,
          status: kakaoStatus,
        });

        return true;
      } catch (error) {
        log.error("Failed to update Kakao campaign status", error);
        throw error;
      }
    }, "updateCampaignStatus");
  }
}
