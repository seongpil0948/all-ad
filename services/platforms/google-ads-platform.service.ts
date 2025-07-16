import type {
  Campaign,
  CampaignMetrics,
  PlatformType,
  CampaignStatus,
  CampaignWithMetrics,
} from "@/types";
import type { GoogleAdsCredentials } from "@/types/credentials.types";
import type { GoogleAdsQueryResponseRow } from "@/types/google-ads-api.types";

import {
  PlatformService,
  ConnectionTestResult,
  TokenRefreshResult,
  PlatformCredentials,
} from "./platform-service.interface";

import { GoogleAdsClient } from "@/services/google-ads/core/google-ads-client";
import { CampaignControlService } from "@/services/google-ads/campaign/campaign-control.service";
import { GoogleMCCAuthService } from "@/services/platforms/google/auth/mcc-auth.service";
import log from "@/utils/logger";

export class GoogleAdsPlatformService implements PlatformService {
  platform: PlatformType = "google";
  private credentials: GoogleAdsCredentials | null = null;
  private googleAdsClient: GoogleAdsClient | null = null;
  private campaignService: CampaignControlService | null = null;
  private mccAuthService: GoogleMCCAuthService | null = null;
  private isMultiAccountMode: boolean = false;

  async testConnection(): Promise<ConnectionTestResult> {
    if (!this.credentials?.refreshToken) {
      return {
        success: false,
        error: "Refresh token not found",
      };
    }

    try {
      const { GoogleAdsApi } = await import("google-ads-api");

      // Initialize Google Ads API client
      const client = new GoogleAdsApi({
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        developer_token: process.env.GOOGLE_DEVELOPER_TOKEN || "",
      });

      // Set up customer with credentials
      const customer = client.Customer({
        customer_id: this.credentials.customerId,
        login_customer_id: this.credentials.customerId,
        refresh_token: this.credentials.refreshToken,
      });

      // Test connection by fetching customer info
      const customerInfo = await customer.query(`
        SELECT
          customer.id,
          customer.descriptive_name,
          customer.currency_code,
          customer.time_zone
        FROM customer
        WHERE customer.id = ${this.credentials.customerId}
      `);

      if (customerInfo.length > 0) {
        const info = customerInfo[0].customer;

        return {
          success: true,
          accountInfo: {
            id: info?.id?.toString() || this.credentials.customerId,
            name: info?.descriptive_name || "Google Ads Account",
            currency: info?.currency_code || undefined,
            timezone: info?.time_zone || undefined,
          },
        };
      }

      return {
        success: false,
        error: "No customer information found",
      };
    } catch (error) {
      log.error("Google Ads connection test failed", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Connection failed",
      };
    }
  }

  async refreshToken(): Promise<TokenRefreshResult> {
    if (!this.credentials?.refreshToken) {
      return {
        success: false,
        error: "Refresh token not found",
      };
    }

    try {
      // Use Google OAuth2 to refresh the access token
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: process.env.GOOGLE_CLIENT_ID || "",
          client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
          refresh_token: this.credentials.refreshToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        log.error("Google Ads token refresh failed", {
          status: response.status,
          error: errorData,
        });

        return {
          success: false,
          error: `Token refresh failed: ${errorData.error || response.status}`,
        };
      }

      const tokenData = await response.json();

      log.info("Google Ads token refreshed successfully", {
        customerId: this.credentials.customerId,
        hasNewToken: !!tokenData.access_token,
      });

      return {
        success: true,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || this.credentials.refreshToken,
      };
    } catch (error) {
      log.error("Google Ads token refresh error", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Token refresh failed",
      };
    }
  }

  async getAccountInfo(): Promise<{
    id: string;
    name: string;
    currency?: string;
    timezone?: string;
  }> {
    return {
      id: "google-ads-legacy",
      name: "Google Ads Legacy Account",
      currency: "USD",
      timezone: "UTC",
    };
  }

  setCredentials(credentials: PlatformCredentials): void {
    this.credentials = credentials as unknown as GoogleAdsCredentials;

    // customerId가 없으면 platform_credentials 테이블의 settings에서 가져오기
    if (!this.credentials.customerId && credentials.settings) {
      const settings = credentials.settings as Record<string, unknown>;

      this.credentials.customerId = settings.customerId as string;
    }

    if (!this.credentials.customerId) {
      throw new Error("Customer ID is required for Google Ads");
    }

    // Google Ads 클라이언트 초기화
    this.googleAdsClient = new GoogleAdsClient({
      clientId: this.credentials.clientId,
      clientSecret: this.credentials.clientSecret,
      developerToken: this.credentials.developerToken,
      refreshToken: this.credentials.refreshToken,
      loginCustomerId: this.credentials.loginCustomerId,
    });

    this.campaignService = new CampaignControlService(this.googleAdsClient);
  }

  async setMultiAccountCredentials(
    credentials: Record<string, unknown>,
  ): Promise<void> {
    this.credentials = credentials as unknown as GoogleAdsCredentials;
    this.isMultiAccountMode = true;

    // MCC 계정인 경우
    if (credentials.is_mcc) {
      this.mccAuthService = new GoogleMCCAuthService();

      await this.mccAuthService.authenticateMCC({
        developerToken: this.credentials.developerToken,
        refreshToken: this.credentials.refreshToken,
        loginCustomerId:
          this.credentials.loginCustomerId || this.credentials.customerId,
      });

      log.info("Google Ads MCC 모드로 초기화됨", {
        mccAccountId: this.credentials.loginCustomerId,
      });
    } else {
      // 일반 계정이지만 multi-account 플래그가 있는 경우
      this.setCredentials(credentials as PlatformCredentials);
    }
  }

  async validateCredentials(): Promise<boolean> {
    if (!this.credentials || !this.googleAdsClient) {
      return false;
    }

    try {
      // 계정 정보 조회로 자격 증명 검증
      const accountInfo = await this.googleAdsClient.getAccountInfo(
        this.credentials.customerId,
      );

      return !!accountInfo;
    } catch (error) {
      log.error("Google Ads credentials validation failed", error as Error);

      return false;
    }
  }

  async fetchCampaigns(): Promise<CampaignWithMetrics[]> {
    if (this.isMultiAccountMode && this.mccAuthService) {
      // MCC 모드: 모든 클라이언트 계정의 캠페인 조회
      try {
        const clientAccounts = await this.mccAuthService.listClientAccounts();
        const allCampaigns: Campaign[] = [];

        for (const account of clientAccounts as GoogleAdsQueryResponseRow[]) {
          if (!account.customer_client) continue;

          const clientId = String(account.customer_client.id);
          const campaigns =
            await this.mccAuthService.getClientCampaigns(clientId);

          // Google Ads 캠페인을 공통 Campaign 타입으로 변환
          const mappedCampaigns: Campaign[] = [];

          for (const row of campaigns) {
            const campaign = row.campaign;
            const metrics = row.metrics;
            const campaignBudget = row.campaign_budget;

            if (!campaign) {
              continue;
            }

            const mappedCampaign: CampaignWithMetrics = {
              id: String(campaign.id || ""),
              team_id: clientId,
              platform: "google" as PlatformType,
              platform_campaign_id: String(campaign.id || ""),
              name: campaign.name || "",
              status: (campaign.status === "ENABLED"
                ? "active"
                : "paused") as CampaignStatus,
              is_active: campaign.status === "ENABLED",
              budget: campaignBudget?.amount_micros
                ? Number(campaignBudget.amount_micros) / 1000000
                : 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              metrics: metrics
                ? [
                    {
                      id: `${String(campaign.id || "")}_${new Date().toISOString().split("T")[0]}`,
                      campaign_id: String(campaign.id || ""),
                      date: new Date().toISOString().split("T")[0],
                      impressions: Number(metrics.impressions || 0),
                      clicks: Number(metrics.clicks || 0),
                      cost: Number(metrics.cost_micros || 0) / 1000000,
                      conversions: Number(metrics.conversions || 0),
                      revenue: Number(metrics.conversions_value || 0),
                      raw_data: null,
                      created_at: new Date().toISOString(),
                    },
                  ]
                : [],
            };

            mappedCampaigns.push(mappedCampaign);
          }

          allCampaigns.push(...mappedCampaigns);
        }

        return allCampaigns as CampaignWithMetrics[];
      } catch (error) {
        log.error("Failed to fetch campaigns via MCC", error as Error);
        throw error;
      }
    }

    // 일반 모드: 단일 계정 캠페인 조회
    if (!this.campaignService || !this.credentials) {
      throw new Error("Google Ads service not initialized");
    }

    try {
      const googleCampaigns = await this.campaignService.getCampaigns(
        this.credentials.customerId,
        false, // includeRemoved = false
      );

      // Google Ads 캠페인을 공통 Campaign 타입으로 변환
      return googleCampaigns.map((campaign) => ({
        id: campaign.id,
        team_id: this.credentials!.customerId, // Use customer ID as team ID for now
        platform: "google" as PlatformType,
        platform_campaign_id: campaign.id,
        name: campaign.name,
        status: campaign.status === "ENABLED" ? "active" : "paused",
        is_active: campaign.status === "ENABLED",
        budget: campaign.budgetAmountMicros
          ? campaign.budgetAmountMicros / 1000000
          : 0, // micros to currency
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // 메트릭 데이터 포함
        metrics:
          campaign.impressions !== undefined
            ? [
                {
                  id: `${campaign.id}_${new Date().toISOString().split("T")[0]}`,
                  campaign_id: campaign.id,
                  date: new Date().toISOString().split("T")[0],
                  impressions: campaign.impressions,
                  clicks: campaign.clicks || 0,
                  cost: (campaign.costMicros || 0) / 1000000,
                  conversions: 0,
                  revenue: 0,
                  raw_data: null,
                  created_at: new Date().toISOString(),
                },
              ]
            : [],
      }));
    } catch (error) {
      log.error("Failed to fetch Google Ads campaigns", error as Error);
      throw error;
    }
  }

  async fetchCampaignMetrics(
    campaignId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CampaignMetrics[]> {
    if (!this.campaignService || !this.credentials) {
      throw new Error("Google Ads service not initialized");
    }

    try {
      const metrics = await this.campaignService.getCampaignMetrics(
        this.credentials.customerId,
        campaignId,
        this.formatDate(startDate),
        this.formatDate(endDate),
      );

      // Google Ads 메트릭을 공통 CampaignMetrics 타입으로 변환
      return metrics.map((metric, index) => ({
        campaignId,
        date: new Date(
          startDate.getTime() + index * 24 * 60 * 60 * 1000,
        ).toISOString(),
        impressions: metric.impressions,
        clicks: metric.clicks,
        cost: metric.costMicros / 1000000,
        conversions: metric.conversions || 0,
        revenue: metric.conversionValue || 0,
        ctr: metric.ctr || 0,
        cpc: metric.averageCpc ? metric.averageCpc / 1000000 : 0,
        cpm: metric.averageCpm ? metric.averageCpm / 1000 : 0,
        roas:
          metric.conversionValue && metric.costMicros > 0
            ? metric.conversionValue / (metric.costMicros / 1000000)
            : 0,
      }));
    } catch (error) {
      log.error("Failed to fetch Google Ads campaign metrics", error as Error);
      throw error;
    }
  }

  async updateCampaignBudget(
    campaignId: string,
    budget: number,
    clientAccountId?: string,
  ): Promise<boolean> {
    if (this.isMultiAccountMode && this.mccAuthService && clientAccountId) {
      // MCC 모드: 클라이언트 계정을 통해 업데이트
      try {
        const customer =
          await this.mccAuthService.accessClientAccount(clientAccountId);
        const budgetMicros = Math.round(budget * 1000000);

        // MCC를 통해 클라이언트 계정의 캠페인 예산 업데이트
        const mutation = {
          entity: "campaign" as const,
          operation: "update" as const,
          resource: {
            resource_name: `customers/${clientAccountId}/campaigns/${campaignId}`,
            budget: {
              amount_micros: budgetMicros,
            },
          },
          update_mask: {
            paths: ["budget.amount_micros"],
          },
        };

        await customer.mutateResources([mutation]);

        log.info("MCC를 통한 캠페인 예산 업데이트 성공", {
          clientAccountId,
          campaignId,
          budget,
        });

        return true;
      } catch (error) {
        log.error("MCC를 통한 캠페인 예산 업데이트 실패", error as Error);

        return false;
      }
    }

    // 일반 모드: 직접 업데이트
    if (!this.campaignService || !this.credentials) {
      throw new Error("Google Ads service not initialized");
    }

    try {
      const budgetMicros = Math.round(budget * 1000000);

      await this.campaignService.updateCampaignBudget(
        this.credentials.customerId,
        campaignId,
        budgetMicros,
      );

      return true;
    } catch (error) {
      log.error("Failed to update Google Ads campaign budget", error as Error);

      return false;
    }
  }

  async updateCampaignStatus(
    campaignId: string,
    isActive: boolean,
  ): Promise<boolean> {
    if (!this.campaignService || !this.credentials) {
      throw new Error("Google Ads service not initialized");
    }

    try {
      const status = isActive ? "ENABLED" : "PAUSED";

      await this.campaignService.updateCampaignStatus(
        this.credentials.customerId,
        [{ campaignId, status }],
      );

      return true;
    } catch (error) {
      log.error("Failed to update Google Ads campaign status", error as Error);

      return false;
    }
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }
}
