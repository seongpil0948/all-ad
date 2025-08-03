import type { Campaign, CampaignMetrics, PlatformCredential } from "@/types";

export interface TikTokAuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  advertiser_ids?: string[];
}

export interface TikTokCampaign {
  campaign_id: string;
  campaign_name: string;
  objective_type: string;
  status: string;
  operation_status: string;
  budget: number;
  budget_mode: string;
  create_time: string;
  modify_time: string;
}

export interface TikTokMetrics {
  campaign_id: string;
  stat_time_day: string;
  spend: string;
  impressions: string;
  clicks: string;
  ctr: string;
  cpc: string;
  cpm: string;
  conversions: string;
  conversion_rate: string;
  cost_per_conversion: string;
}

export interface TikTokApiResponse<T> {
  code: number;
  message: string;
  request_id: string;
  data: T;
}

export interface TikTokCampaignListData {
  list: TikTokCampaign[];
  page_info: {
    page: number;
    page_size: number;
    total_number: number;
    total_page: number;
  };
}

export interface TikTokReportData {
  list: TikTokMetrics[];
  page_info: {
    page: number;
    page_size: number;
    total_number: number;
    total_page: number;
  };
}

export class TikTokAdsApi {
  private baseUrl = "https://business-api.tiktok.com/open_api/v1.3";
  private accessToken: string;
  private advertiserId: string;

  constructor(credential: PlatformCredential) {
    this.accessToken = credential.access_token || "";
    // Get advertiser ID from data field
    this.advertiserId =
      (credential.data as any)?.tiktok_advertiser_id ||
      credential.account_id ||
      "";
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<TikTokApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Access-Token": this.accessToken,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json();

    if (data.code !== 0) {
      throw new Error(`TikTok API Error: ${data.message} (${data.code})`);
    }

    return data;
  }

  async refreshToken(refreshToken: string): Promise<TikTokAuthResponse> {
    const response = await fetch(
      "https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          app_id: process.env.TIKTOK_APP_ID,
          secret: process.env.TIKTOK_APP_SECRET,
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }),
      },
    );

    const data = await response.json();

    if (data.code !== 0) {
      throw new Error(`Token refresh failed: ${data.message}`);
    }

    return data.data;
  }

  async getAccountInfo() {
    const response = await this.request<{
      list: Array<{
        advertiser_id: string;
        advertiser_name: string;
        currency: string;
        timezone: string;
        brand: string;
        balance: number;
        status: string;
      }>;
    }>(`/advertiser/info/?advertiser_ids=["${this.advertiserId}"]`, {
      method: "GET",
    });

    return response.data.list[0];
  }

  async getCampaigns(
    page = 1,
    pageSize = 100,
  ): Promise<TikTokCampaignListData> {
    const params = new URLSearchParams({
      advertiser_id: this.advertiserId,
      page: page.toString(),
      page_size: pageSize.toString(),
      fields: JSON.stringify([
        "campaign_id",
        "campaign_name",
        "objective_type",
        "status",
        "operation_status",
        "budget",
        "budget_mode",
        "create_time",
        "modify_time",
      ]),
    });

    const response = await this.request<TikTokCampaignListData>(
      `/campaign/get/?${params}`,
      {
        method: "GET",
      },
    );

    return response.data;
  }

  async getCampaignMetrics(
    campaignIds: string[],
    startDate: string,
    endDate: string,
  ): Promise<TikTokReportData> {
    const params = new URLSearchParams({
      advertiser_id: this.advertiserId,
      report_type: "BASIC",
      data_level: "AUCTION_CAMPAIGN",
      dimensions: JSON.stringify(["campaign_id", "stat_time_day"]),
      metrics: JSON.stringify([
        "spend",
        "impressions",
        "clicks",
        "ctr",
        "cpc",
        "cpm",
        "conversions",
        "conversion_rate",
        "cost_per_conversion",
      ]),
      filters: JSON.stringify([
        {
          field_name: "campaign_id",
          filter_type: "IN",
          filter_value: campaignIds,
        },
      ]),
      start_date: startDate,
      end_date: endDate,
      page_size: "1000",
    });

    const response = await this.request<TikTokReportData>(
      `/report/integrated/get/?${params}`,
      {
        method: "GET",
      },
    );

    return response.data;
  }

  async updateCampaignStatus(
    campaignId: string,
    status: "ENABLE" | "DISABLE",
  ): Promise<boolean> {
    const response = await this.request<{
      success_count: number;
      fail_list: any[];
    }>("/campaign/update/status/", {
      method: "POST",
      body: JSON.stringify({
        advertiser_id: this.advertiserId,
        campaign_ids: [campaignId],
        operation_status: status,
      }),
    });

    return response.data.success_count > 0;
  }

  async updateCampaignBudget(
    campaignId: string,
    budget: number,
  ): Promise<boolean> {
    const response = await this.request<{
      success_count: number;
      fail_list: any[];
    }>("/campaign/update/", {
      method: "POST",
      body: JSON.stringify({
        advertiser_id: this.advertiserId,
        campaign_id: campaignId,
        budget: budget,
      }),
    });

    return response.data.success_count > 0;
  }

  static transformCampaign(
    tiktokCampaign: TikTokCampaign,
    platformCredentialId: string,
  ): Partial<Campaign> & { external_id: string } {
    return {
      external_id: tiktokCampaign.campaign_id,
      name: tiktokCampaign.campaign_name,
      status:
        tiktokCampaign.operation_status === "ENABLE" ? "active" : "paused",
      budget: tiktokCampaign.budget,
      platform: "tiktok",
      platform_credential_id: platformCredentialId,
      raw_data: tiktokCampaign as any,
    };
  }

  static transformMetrics(metrics: TikTokMetrics): Partial<CampaignMetrics> {
    return {
      impressions: parseInt(metrics.impressions) || 0,
      clicks: parseInt(metrics.clicks) || 0,
      cost: parseFloat(metrics.spend) || 0,
      conversions: parseInt(metrics.conversions) || 0,
      ctr: parseFloat(metrics.ctr) || 0,
      cpc: parseFloat(metrics.cpc) || 0,
      cpm: parseFloat(metrics.cpm) || 0,
      raw_data: metrics as any,
    };
  }
}
