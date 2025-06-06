"use server";

import { GoogleAdsApi } from "google-ads-api";

import log from "@/utils/logger";

export interface GoogleAdsTestCredentials {
  clientId: string;
  clientSecret: string;
  developerToken: string;
  refreshToken: string;
  loginCustomerId?: string;
}

export interface GoogleAdsCampaign {
  id: string;
  name: string;
  status: string;
  budgetAmountMicros?: string;
  impressions?: string;
  clicks?: string;
  costMicros?: string;
}

// Google Ads API 클라이언트 생성
function createGoogleAdsClient(credentials: GoogleAdsTestCredentials) {
  const client = new GoogleAdsApi({
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    developer_token: credentials.developerToken,
  });

  const customer = client.Customer({
    customer_id: credentials.loginCustomerId || "",
    refresh_token: credentials.refreshToken,
    login_customer_id: credentials.loginCustomerId,
  });

  return { client, customer };
}

// OAuth2 인증 URL 생성
export async function generateAuthUrl(clientId: string, redirectUri: string) {
  try {
    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent("https://www.googleapis.com/auth/adwords")}&` +
      `access_type=offline&` +
      `prompt=consent`;

    log.info("Auth URL generated", { clientId });

    return { success: true, authUrl };
  } catch (error) {
    log.error("Failed to generate auth URL", error);

    return { success: false, error: "인증 URL 생성 실패" };
  }
}

// OAuth2 토큰 교환
export async function exchangeCodeForToken(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string,
) {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code: code,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error_description || "토큰 교환 실패");
    }

    log.info("Token exchanged successfully");

    return {
      success: true,
      refreshToken: data.refresh_token,
      accessToken: data.access_token,
    };
  } catch (error) {
    log.error("Failed to exchange code for token", error);

    return { success: false, error: "토큰 교환 실패" };
  }
}

// 계정 목록 가져오기
export async function fetchGoogleAdsAccounts(
  credentials: GoogleAdsTestCredentials,
) {
  try {
    const { customer } = createGoogleAdsClient(credentials);

    const query = `
      SELECT
        customer_client.id,
        customer_client.descriptive_name,
        customer_client.currency_code,
        customer_client.time_zone,
        customer_client.manager
      FROM customer_client
      WHERE customer_client.status = 'ENABLED'
    `;

    const response = await customer.query(query);

    const accounts = response.map((row: any) => ({
      id: row.customer_client.id,
      name: row.customer_client.descriptive_name,
      currencyCode: row.customer_client.currency_code,
      timeZone: row.customer_client.time_zone,
      isManager: row.customer_client.manager,
    }));

    log.info("Fetched Google Ads accounts", { count: accounts.length });

    return { success: true, accounts };
  } catch (error: any) {
    log.error("Failed to fetch accounts", error);

    return {
      success: false,
      error: error.message || "계정 목록 조회 실패",
      details: error.details || undefined,
    };
  }
}

// 캠페인 목록 가져오기
export async function fetchCampaigns(
  credentials: GoogleAdsTestCredentials,
  customerId: string,
) {
  try {
    const { client } = createGoogleAdsClient(credentials);

    // 특정 고객 ID로 새 customer 인스턴스 생성
    const customer = client.Customer({
      customer_id: customerId,
      refresh_token: credentials.refreshToken,
      login_customer_id: credentials.loginCustomerId,
    });

    const query = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.campaign_budget,
        campaign_budget.amount_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros
      FROM campaign
      WHERE segments.date DURING LAST_30_DAYS
        AND campaign.status != 'REMOVED'
      ORDER BY campaign.id
    `;

    const response = await customer.query(query);

    const campaigns: GoogleAdsCampaign[] = response.map((row: any) => ({
      id: row.campaign.id,
      name: row.campaign.name,
      status: row.campaign.status,
      budgetAmountMicros: row.campaign_budget?.amount_micros,
      impressions: row.metrics?.impressions,
      clicks: row.metrics?.clicks,
      costMicros: row.metrics?.cost_micros,
    }));

    log.info("Fetched campaigns", { customerId, count: campaigns.length });

    return { success: true, campaigns };
  } catch (error: any) {
    log.error("Failed to fetch campaigns", error);

    return {
      success: false,
      error: error.message || "캠페인 목록 조회 실패",
      details: error.details || undefined,
    };
  }
}

// 캠페인 상태 변경
export async function updateCampaignStatus(
  credentials: GoogleAdsTestCredentials,
  customerId: string,
  campaignId: string,
  status: "ENABLED" | "PAUSED",
) {
  try {
    const { client } = createGoogleAdsClient(credentials);

    const customer = client.Customer({
      customer_id: customerId,
      refresh_token: credentials.refreshToken,
      login_customer_id: credentials.loginCustomerId,
    });

    const operations: any[] = [
      {
        entity: "campaign",
        operation: "update",
        resource: {
          resource_name: `customers/${customerId}/campaigns/${campaignId}`,
          status: status,
        },
        update_mask: {
          paths: ["status"],
        },
      },
    ];

    const response = await customer.mutateResources(operations);

    log.info("Campaign status updated", { customerId, campaignId, status });

    return { success: true, response };
  } catch (error: any) {
    log.error("Failed to update campaign status", error);

    return {
      success: false,
      error: error.message || "캠페인 상태 변경 실패",
      details: error.details || undefined,
    };
  }
}

// 라벨 생성
export async function createLabel(
  credentials: GoogleAdsTestCredentials,
  customerId: string,
  labelData: {
    name: string;
    description?: string;
    backgroundColor?: string;
  },
) {
  try {
    const { client } = createGoogleAdsClient(credentials);

    const customer = client.Customer({
      customer_id: customerId,
      refresh_token: credentials.refreshToken,
      login_customer_id: credentials.loginCustomerId,
    });

    const operations: any[] = [
      {
        entity: "label",
        operation: "create",
        resource: {
          name: labelData.name,
          description: labelData.description,
          background_color: {
            red: 0,
            green: 0,
            blue: 255,
          },
        },
      },
    ];

    const response = await customer.mutateResources(operations);

    log.info("Label created", { customerId, labelName: labelData.name });

    return { success: true, response };
  } catch (error: any) {
    log.error("Failed to create label", error);

    return {
      success: false,
      error: error.message || "라벨 생성 실패",
      details: error.details || undefined,
    };
  }
}

// 테스트 연결
export async function testConnection(credentials: GoogleAdsTestCredentials) {
  try {
    const { customer } = createGoogleAdsClient(credentials);

    // 간단한 쿼리로 연결 테스트
    const query = `
      SELECT
        customer.id,
        customer.descriptive_name
      FROM customer
      LIMIT 1
    `;

    const response = await customer.query(query);

    log.info("Connection test successful");

    return {
      success: true,
      message: "Google Ads API 연결 성공",
      customer: response[0]?.customer,
    };
  } catch (error: any) {
    log.error("Connection test failed", error);

    return {
      success: false,
      error: error.message || "연결 테스트 실패",
      details: error.details || undefined,
    };
  }
}
