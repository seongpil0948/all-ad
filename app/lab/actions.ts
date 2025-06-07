"use server";

import type {
  GoogleAdsQueryResponseRow,
  GoogleAdsAccountInfo,
  GoogleOAuthTokenResponse,
  MutateResourceResponse,
} from "@/types/google-ads-api.types";
import type {
  MetaAdsApiResponse,
  MetaAdsAccountRaw,
  MetaAdsCampaignRaw,
} from "@/types/meta-ads.types";

import { GoogleAdsApi } from "google-ads-api";

import log from "@/utils/logger";
import { MetaAdsIntegrationService } from "@/services/meta-ads/meta-ads-integration.service";

export interface GoogleAdsTestCredentials {
  clientId: string;
  clientSecret: string;
  developerToken: string;
  accessToken?: string; // 선택적, OAuth2 인증 후 사용
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
function createGoogleAdsClient(
  credentials: GoogleAdsTestCredentials,
  targetCustomerId?: string,
) {
  const client = new GoogleAdsApi({
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    developer_token: credentials.developerToken,
  });

  // MCC 계정으로 로그인하여 다른 계정에 접근하는 경우
  const customer = client.Customer({
    // customer_id: targetCustomerId || credentials.loginCustomerId || "", // 작업할 대상 계정
    customer_id: targetCustomerId || credentials.loginCustomerId || "", // 작업할 대상 계정
    refresh_token: credentials.refreshToken,
    login_customer_id: credentials.loginCustomerId, // MCC 관리자 계정
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
      `prompt=consent&` +
      `include_granted_scopes=true`;

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
): Promise<{
  success: boolean;
  refreshToken?: string;
  accessToken?: string;
  error?: string;
}> {
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

    const data: GoogleOAuthTokenResponse = await response.json();

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
    // MCC 계정을 사용하여 하위 계정 목록 조회
    const { customer } = createGoogleAdsClient(
      credentials,
      credentials.loginCustomerId,
    );

    // 두 가지 쿼리를 시도: 먼저 customer_client_link로, 실패하면 customer_client로
    let accounts: GoogleAdsAccountInfo[] = [];

    try {
      // customer_client_link를 통해 연결된 모든 계정 조회 (테스트 계정 포함)
      const linkQuery = `
        SELECT
          customer_client_link.client_customer,
          customer_client_link.status,
          customer_client_link.manager_link_id
        FROM customer_client_link
        WHERE customer_client_link.status = 'ACTIVE'
      `;

      const linkResponse: GoogleAdsQueryResponseRow[] =
        await customer.query(linkQuery);

      // 각 연결된 계정의 세부 정보 조회
      for (const link of linkResponse) {
        if (!link?.customer_client_link?.client_customer) continue;

        const clientCustomerId = link.customer_client_link.client_customer
          .split("/")
          .pop();

        if (!clientCustomerId) continue;

        try {
          const { customer: clientCustomer } = createGoogleAdsClient(
            credentials,
            clientCustomerId,
          );

          const detailQuery = `
            SELECT
              customer.id,
              customer.descriptive_name,
              customer.currency_code,
              customer.time_zone,
              customer.test_account,
              customer.manager
            FROM customer
            LIMIT 1
          `;

          const detailResponse: GoogleAdsQueryResponseRow[] =
            await clientCustomer.query(detailQuery);

          if (detailResponse && detailResponse.length > 0) {
            const customerData = detailResponse[0]?.customer;

            if (customerData) {
              accounts.push({
                id: customerData.id,
                name:
                  customerData.descriptive_name || `Account ${customerData.id}`,
                currencyCode: customerData.currency_code,
                timeZone: customerData.time_zone,
                isManager: customerData.manager || false,
                isTestAccount: customerData.test_account || false,
              });
            }
          }
        } catch (detailError) {
          log.warn(`Failed to fetch details for account ${clientCustomerId}`, {
            error:
              detailError instanceof Error
                ? detailError.message
                : String(detailError),
          });
        }
      }
    } catch (linkError) {
      log.warn("customer_client_link query failed, trying customer_client", {
        error:
          linkError instanceof Error ? linkError.message : String(linkError),
      });

      // Fallback: customer_client 테이블 사용
      const clientQuery = `
        SELECT
          customer_client.id,
          customer_client.descriptive_name,
          customer_client.currency_code,
          customer_client.time_zone,
          customer_client.manager,
          customer_client.test_account
        FROM customer_client
        WHERE customer_client.status = 'ENABLED'
      `;

      const clientResponse: GoogleAdsQueryResponseRow[] =
        await customer.query(clientQuery);

      accounts = clientResponse
        .filter((row) => row.customer_client)
        .map((row) => ({
          id: row.customer_client!.id,
          name:
            row.customer_client!.descriptive_name ||
            `Account ${row.customer_client!.id}`,
          currencyCode: row.customer_client!.currency_code,
          timeZone: row.customer_client!.time_zone,
          isManager: row.customer_client!.manager || false,
          isTestAccount: row.customer_client!.test_account || false,
        }));
    }

    // MCC 계정 자체도 추가
    try {
      const mccQuery = `
        SELECT
          customer.id,
          customer.descriptive_name,
          customer.currency_code,
          customer.time_zone,
          customer.test_account,
          customer.manager
        FROM customer
        LIMIT 1
      `;

      const mccResponse: GoogleAdsQueryResponseRow[] =
        await customer.query(mccQuery);

      if (mccResponse && mccResponse.length > 0) {
        const mccData = mccResponse[0]?.customer;

        if (mccData) {
          const mccAccount = {
            id: mccData.id,
            name: mccData.descriptive_name || `MCC Account ${mccData.id}`,
            currencyCode: mccData.currency_code,
            timeZone: mccData.time_zone,
            isManager: true,
            isTestAccount: mccData.test_account || false,
            isMCC: true,
          };

          // MCC 계정이 목록에 없으면 추가
          if (!accounts.find((acc) => acc.id === mccAccount.id)) {
            accounts.unshift(mccAccount);
          }
        }
      }
    } catch (mccError) {
      log.warn("Failed to fetch MCC account details", {
        error: mccError instanceof Error ? mccError.message : String(mccError),
      });
    }

    log.info("Fetched Google Ads accounts", {
      count: accounts.length,
      accounts: accounts.map((acc) => ({
        id: acc.id,
        name: acc.name,
        isManager: acc.isManager,
        isTestAccount: acc.isTestAccount,
      })),
    });

    return { success: true, accounts };
  } catch (error) {
    log.error("Failed to fetch accounts", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "계정 목록 조회 실패",
      details:
        error instanceof Error && "details" in error
          ? (error as Error & { details: unknown }).details
          : undefined,
      accounts: [],
    };
  }
}

// 캠페인 목록 가져오기
export async function fetchCampaigns(
  credentials: GoogleAdsTestCredentials,
  customerId: string,
) {
  try {
    // 특정 고객 ID를 대상으로 작업
    const { customer } = createGoogleAdsClient(credentials, customerId);

    // Manager 계정인지 확인
    const isManagerAccount = customerId === credentials.loginCustomerId;

    // Manager 계정에서는 메트릭을 제외한 기본 정보만 조회
    const query = isManagerAccount
      ? `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.campaign_budget,
        campaign_budget.amount_micros
      FROM campaign
      WHERE campaign.status != 'REMOVED'
      ORDER BY campaign.id
    `
      : `
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

    const response: GoogleAdsQueryResponseRow[] = await customer.query(query);

    const campaigns: GoogleAdsCampaign[] = response
      .filter((row) => row.campaign)
      .map((row) => ({
        id: row.campaign!.id,
        name: row.campaign!.name,
        status: row.campaign!.status,
        budgetAmountMicros: row.campaign_budget?.amount_micros,
        impressions: row.metrics?.impressions,
        clicks: row.metrics?.clicks,
        costMicros: row.metrics?.cost_micros,
      }));

    log.info("Fetched campaigns", { customerId, count: campaigns.length });

    return { success: true, campaigns };
  } catch (error) {
    log.error("Failed to fetch campaigns", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "캠페인 목록 조회 실패",
      details:
        error instanceof Error && "details" in error
          ? (error as Error & { details: unknown }).details
          : undefined,
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
    // 특정 고객 ID를 대상으로 작업
    const { customer } = createGoogleAdsClient(credentials, customerId);

    const operations = [
      {
        entity: "campaign" as const,
        operation: "update" as const,
        resource: {
          resource_name: `customers/${customerId}/campaigns/${campaignId}`,
          status: status,
        },
        update_mask: {
          paths: ["status"],
        },
      },
    ];

    const response: MutateResourceResponse =
      await customer.mutateResources(operations);

    log.info("Campaign status updated", { customerId, campaignId, status });

    return { success: true, response };
  } catch (error) {
    log.error("Failed to update campaign status", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "캠페인 상태 변경 실패",
      details:
        error instanceof Error && "details" in error
          ? (error as Error & { details: unknown }).details
          : undefined,
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
    // 특정 고객 ID를 대상으로 작업
    const { customer } = createGoogleAdsClient(credentials, customerId);

    const operations = [
      {
        entity: "label" as const,
        operation: "create" as const,
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

    const response: MutateResourceResponse =
      await customer.mutateResources(operations);

    log.info("Label created", { customerId, labelName: labelData.name });

    return { success: true, response };
  } catch (error) {
    log.error("Failed to create label", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "라벨 생성 실패",
      details:
        error instanceof Error && "details" in error
          ? (error as Error & { details: unknown }).details
          : undefined,
    };
  }
}

// 테스트 연결
export async function testConnection(credentials: GoogleAdsTestCredentials) {
  try {
    // MCC 계정으로 연결 테스트
    const { customer } = createGoogleAdsClient(
      credentials,
      credentials.loginCustomerId,
    );

    // 간단한 쿼리로 연결 테스트
    const query = `
      SELECT
        customer.id,
        customer.descriptive_name
      FROM customer
      LIMIT 1
    `;

    const response: GoogleAdsQueryResponseRow[] = await customer.query(query);

    log.info("Connection test successful");

    return {
      success: true,
      message: "Google Ads API 연결 성공",
      customer: response[0]?.customer,
    };
  } catch (error) {
    log.error("Connection test failed", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "연결 테스트 실패",
      details:
        error instanceof Error && "details" in error
          ? (error as Error & { details: unknown }).details
          : undefined,
    };
  }
}

// Meta/Facebook Ads 관련 액션 추가
export interface MetaAdsTestCredentials {
  appId: string;
  appSecret: string;
  accessToken: string;
  businessId?: string;
}

// Meta Ads 토큰 교환
export async function exchangeMetaToken(
  code: string,
  appId: string,
  appSecret: string,
  redirectUri: string,
): Promise<{
  success: boolean;
  accessToken?: string;
  error?: string;
}> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v23.0/oauth/access_token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: appId,
          client_secret: appSecret,
          redirect_uri: redirectUri,
          code: code,
        }),
      },
    );

    const data: MetaAdsApiResponse<unknown> & { access_token?: string } =
      await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "토큰 교환 실패");
    }

    log.info("Meta token exchanged successfully");

    return {
      success: true,
      accessToken: data.access_token,
    };
  } catch (error) {
    log.error("Failed to exchange Meta token", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "토큰 교환 실패",
    };
  }
}

// Meta Ads 계정 목록 가져오기
export async function fetchMetaAdsAccounts(
  credentials: MetaAdsTestCredentials,
) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v23.0/me/adaccounts?fields=id,name,account_status,currency,timezone_name&access_token=${credentials.accessToken}`,
    );

    const data: MetaAdsApiResponse<MetaAdsAccountRaw> = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error?.message || "계정 목록 조회 실패");
    }

    const accounts =
      data.data?.map((account) => ({
        id: account.id.replace("act_", ""),
        name: account.name,
        status: account.account_status,
        currency: account.currency,
        timezone: account.timezone_name,
      })) || [];

    log.info("Fetched Meta ad accounts", { count: accounts.length });

    return { success: true, accounts };
  } catch (error) {
    log.error("Failed to fetch Meta accounts", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "계정 목록 조회 실패",
      accounts: [],
    };
  }
}

// Meta Ads 캠페인 목록 가져오기
export async function fetchMetaCampaigns(
  credentials: MetaAdsTestCredentials,
  accountId: string,
) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v23.0/act_${accountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget&access_token=${credentials.accessToken}`,
    );

    const data: MetaAdsApiResponse<MetaAdsCampaignRaw> = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error?.message || "캠페인 목록 조회 실패");
    }

    const campaigns =
      data.data?.map((campaign) => ({
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
      })) || [];

    log.info("Fetched Meta campaigns", { accountId, count: campaigns.length });

    return { success: true, campaigns };
  } catch (error) {
    log.error("Failed to fetch Meta campaigns", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "캠페인 목록 조회 실패",
      campaigns: [],
    };
  }
}

// Meta Ads 캠페인 상태 변경
export async function updateMetaCampaignStatus(
  credentials: MetaAdsTestCredentials,
  campaignId: string,
  status: "ACTIVE" | "PAUSED",
) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v23.0/${campaignId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: status,
          access_token: credentials.accessToken,
        }),
      },
    );

    const data: MetaAdsApiResponse<unknown> = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error?.message || "캠페인 상태 변경 실패");
    }

    log.info("Meta campaign status updated", { campaignId, status });

    return { success: true };
  } catch (error) {
    log.error("Failed to update Meta campaign status", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "캠페인 상태 변경 실패",
    };
  }
}

// Meta Ads 캠페인 배치 상태 변경
export async function batchUpdateMetaCampaignStatus(
  credentials: MetaAdsTestCredentials,
  updates: Array<{ campaignId: string; status: "ACTIVE" | "PAUSED" }>,
) {
  try {
    const metaService = new MetaAdsIntegrationService({
      accessToken: credentials.accessToken || "",
      appId: credentials.appId,
      appSecret: credentials.appSecret,
      businessId: credentials.businessId,
    });

    const results = await metaService.batchUpdateCampaignStatus(updates);

    log.info("Batch updated Meta campaign statuses", results);

    return {
      success: true,
      results,
    };
  } catch (error) {
    log.error("Failed to batch update Meta campaign statuses", error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "배치 캠페인 상태 변경 실패",
    };
  }
}

// Meta Ads 캐시 초기화
export async function clearMetaCache(pattern?: string) {
  try {
    const metaService = new MetaAdsIntegrationService({
      accessToken: "dummy", // Cache clearing doesn't need valid token
    });

    await metaService.clearCache(pattern);

    log.info("Meta cache cleared", { pattern });

    return { success: true };
  } catch (error) {
    log.error("Failed to clear Meta cache", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "캐시 초기화 실패",
    };
  }
}
