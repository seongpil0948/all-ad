"use server";

import type {
  GoogleAdsQueryResponseRow,
  GoogleAdsAccountInfo,
  GoogleOAuthTokenResponse,
} from "@/types/google-ads-api.types";
import type { MutateOperation } from "google-ads-api";

import { GoogleAdsApi } from "google-ads-api";

import log from "@/utils/logger";

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
  conversions?: string;
  ctr?: string;
  averageCpc?: string;
}

// Google Ads API 클라이언트 생성
function createGoogleAdsClient(
  credentials: GoogleAdsTestCredentials,
  targetCustomerId?: string,
) {
  // 필수 자격 증명 검증
  if (
    !credentials.clientId ||
    !credentials.clientSecret ||
    !credentials.developerToken
  ) {
    throw new Error("필수 API 자격 증명이 누락되었습니다");
  }

  if (!credentials.refreshToken) {
    throw new Error(
      "Refresh token이 필요합니다. OAuth 인증을 먼저 완료해주세요.",
    );
  }

  const client = new GoogleAdsApi({
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    developer_token: credentials.developerToken,
  });

  // MCC 계정으로 로그인하여 다른 계정에 접근하는 경우
  const customerConfig = {
    customer_id: targetCustomerId || credentials.loginCustomerId || "", // 작업할 대상 계정
    refresh_token: credentials.refreshToken,
    ...(credentials.loginCustomerId && {
      login_customer_id: credentials.loginCustomerId,
    }), // MCC 관리자 계정 (optional)
  };

  const customer = client.Customer(customerConfig);

  return { client, customer };
}

// OAuth2 인증 URL 생성
export async function generateAuthUrl(clientId: string, redirectUri: string) {
  try {
    // Google Ads API 문서에 따른 정확한 OAuth2 파라미터
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/adwords",
      access_type: "offline", // refresh token을 받기 위해 필수
      prompt: "consent", // 매번 동의 화면을 보여주어 refresh token 보장
      include_granted_scopes: "true",
      // state 파라미터 추가 (CSRF 방지)
      state: Buffer.from(
        JSON.stringify({
          timestamp: Date.now(),
          source: "lab",
        }),
      ).toString("base64"),
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    log.info("Google Ads OAuth URL generated", {
      clientId,
      redirectUri,
      scopes: "https://www.googleapis.com/auth/adwords",
    });

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
    if (!clientId) {
      throw new Error("Could not determine client ID from request.");
    }

    log.info("Exchanging code for token", {
      hasCode: !!code,
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      redirectUri,
    });

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
      log.error("Token exchange failed", {
        error: data.error,
        error_description: data.error_description,
        status: response.status,
      });
      throw new Error(data.error_description || data.error || "토큰 교환 실패");
    }

    log.info("Token exchanged successfully", {
      hasRefreshToken: !!data.refresh_token,
      hasAccessToken: !!data.access_token,
    });

    return {
      success: true,
      refreshToken: data.refresh_token,
      accessToken: data.access_token,
    };
  } catch (error) {
    log.error("Failed to exchange code for token", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "토큰 교환 실패",
    };
  }
}

// 계정 목록 가져오기 - 개선된 버전
export async function fetchGoogleAdsAccounts(
  credentials: GoogleAdsTestCredentials,
): Promise<{
  success: boolean;
  accounts?: GoogleAdsAccountInfo[];
  error?: string;
}> {
  try {
    const { customer } = createGoogleAdsClient(
      credentials,
      credentials.loginCustomerId,
    );

    const accounts: GoogleAdsAccountInfo[] = [];

    // Google Ads API 문서에 따른 정확한 계정 조회 방법
    try {
      // 1. MCC 계정인 경우 하위 계정 조회
      if (credentials.loginCustomerId) {
        const clientQuery = `
          SELECT
            customer_client.client_customer,
            customer_client.id,
            customer_client.descriptive_name,
            customer_client.currency_code,
            customer_client.time_zone,
            customer_client.manager,
            customer_client.test_account,
            customer_client.status,
            customer_client.level,
            customer_client.hidden
          FROM customer_client
          WHERE customer_client.level <= 1
        `;

        const clientResponse: GoogleAdsQueryResponseRow[] =
          await customer.query(clientQuery);

        log.info(
          `Found ${clientResponse.length} accounts via customer_client`,
          {
            loginCustomerId: credentials.loginCustomerId,
          },
        );

        // 모든 계정 처리
        for (const row of clientResponse) {
          if (!row.customer_client) continue;

          const account: GoogleAdsAccountInfo = {
            id: row.customer_client.id,
            name:
              row.customer_client.descriptive_name ||
              `Account ${row.customer_client.id}`,
            currencyCode: row.customer_client.currency_code,
            timeZone: row.customer_client.time_zone,
            isManager: row.customer_client.manager || false,
            isTestAccount: row.customer_client.test_account || false,
            isMCC: row.customer_client.manager || false,
            status: row.customer_client.status,
            isHidden: row.customer_client.hidden || false,
            level: row.customer_client.level
              ? parseInt(row.customer_client.level, 10)
              : undefined,
            resourceName: row.customer_client.client_customer,
          };

          accounts.push(account);
        }
      }

      // 2. 현재 계정 정보도 조회 (단일 계정 또는 MCC 자체)
      const currentAccountQuery = `
        SELECT
          customer.id,
          customer.descriptive_name,
          customer.currency_code,
          customer.time_zone,
          customer.test_account,
          customer.manager,
          customer.status
        FROM customer
        LIMIT 1
      `;

      const currentAccountResponse: GoogleAdsQueryResponseRow[] =
        await customer.query(currentAccountQuery);

      if (currentAccountResponse?.[0]?.customer) {
        const currentAccount = currentAccountResponse[0].customer;

        // 이미 추가된 계정이 아닌 경우에만 추가
        if (!accounts.find((acc) => acc.id === currentAccount.id)) {
          accounts.push({
            id: currentAccount.id,
            name:
              currentAccount.descriptive_name || `Account ${currentAccount.id}`,
            currencyCode: currentAccount.currency_code,
            timeZone: currentAccount.time_zone,
            isManager: currentAccount.manager || false,
            isTestAccount: currentAccount.test_account || false,
            isMCC: currentAccount.manager || false,
            status: currentAccount.status,
          });
        }
      }
    } catch (queryError) {
      log.error("Failed to query accounts", queryError);

      // 기본 계정 정보만이라도 반환
      try {
        const basicQuery = `
          SELECT
            customer.id,
            customer.descriptive_name,
            customer.currency_code,
            customer.time_zone,
            customer.manager
          FROM customer
          LIMIT 1
        `;

        const basicResponse: GoogleAdsQueryResponseRow[] =
          await customer.query(basicQuery);

        if (basicResponse?.[0]?.customer) {
          const basicAccount = basicResponse[0].customer;

          accounts.push({
            id: basicAccount.id,
            name: basicAccount.descriptive_name || `Account ${basicAccount.id}`,
            currencyCode: basicAccount.currency_code,
            timeZone: basicAccount.time_zone,
            isManager: basicAccount.manager || false,
            isTestAccount: false,
            isMCC: basicAccount.manager || false,
          });
        }
      } catch (basicError) {
        log.error("Failed to get basic account info", basicError);
        throw basicError;
      }
    }

    // 계정 정렬: 관리자 계정을 먼저, 그 다음 이름순
    accounts.sort((a, b) => {
      if (a.isManager !== b.isManager) {
        return a.isManager ? -1 : 1;
      }

      return (a.name || "").localeCompare(b.name || "");
    });

    log.info(`Total ${accounts.length} accounts found`, {
      managerAccounts: accounts.filter((a) => a.isManager).length,
      regularAccounts: accounts.filter((a) => !a.isManager).length,
      testAccounts: accounts.filter((a) => a.isTestAccount).length,
    });

    return { success: true, accounts };
  } catch (error) {
    log.error("Failed to fetch Google Ads accounts", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "계정 목록 조회 실패",
    };
  }
}

// 캠페인 목록 가져오기 (메트릭 포함)
export async function fetchCampaigns(
  credentials: GoogleAdsTestCredentials,
  customerId: string,
): Promise<{
  success: boolean;
  campaigns?: GoogleAdsCampaign[];
  error?: string;
}> {
  try {
    const { customer } = createGoogleAdsClient(credentials, customerId);

    const query = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign_budget.amount_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.ctr,
        metrics.average_cpc
      FROM campaign
      WHERE segments.date DURING LAST_30_DAYS
        AND campaign.status != 'REMOVED'
      ORDER BY campaign.name
    `;

    const response: GoogleAdsQueryResponseRow[] = await customer.query(query);

    const campaigns: GoogleAdsCampaign[] = response.map((row) => ({
      id: row.campaign?.id || "",
      name: row.campaign?.name || "",
      status: row.campaign?.status || "",
      budgetAmountMicros: row.campaign_budget?.amount_micros || "0",
      impressions: row.metrics?.impressions || "0",
      clicks: row.metrics?.clicks || "0",
      costMicros: row.metrics?.cost_micros || "0",
      conversions: row.metrics?.conversions || "0",
      ctr: row.metrics?.ctr || "0",
      averageCpc: row.metrics?.average_cpc || "0",
    }));

    log.info(`Found ${campaigns.length} campaigns with metrics`, {
      customerId,
    });

    return { success: true, campaigns };
  } catch (error) {
    log.error("Failed to fetch campaigns", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "캠페인 목록 조회 실패",
    };
  }
}

// 캠페인 상태 업데이트
export async function updateCampaignStatus(
  credentials: GoogleAdsTestCredentials,
  customerId: string,
  campaignId: string,
  status: "ENABLED" | "PAUSED",
): Promise<{
  success: boolean;
  error?: string;
  details?: unknown;
}> {
  try {
    log.info("Starting campaign status update", {
      customerId,
      campaignId,
      status,
      hasRefreshToken: !!credentials.refreshToken,
    });

    const { customer } = createGoogleAdsClient(credentials, customerId);

    // Google Ads API의 mutate 방식으로 변경
    let mutateResponse;

    try {
      // 먼저 현재 캠페인 상태 확인
      const checkQuery = `
        SELECT campaign.id, campaign.name, campaign.status 
        FROM campaign 
        WHERE campaign.id = ${campaignId}
      `;

      const currentCampaigns = await customer.query(checkQuery);

      if (!currentCampaigns || currentCampaigns.length === 0) {
        throw new Error(`Campaign not found: ${campaignId}`);
      }

      log.info("Current campaign status", {
        campaign: JSON.stringify(currentCampaigns[0]),
      });

      // Google Ads API v20의 정확한 mutation 형식
      const operations = [
        {
          entity: "campaign",
          operation: "update" as const,
          resource: {
            resource_name: `customers/${customerId}/campaigns/${campaignId}`,
            status: status,
          },
          update_mask: {
            paths: ["status"],
          },
        } as MutateOperation<Record<string, unknown>>,
      ];

      log.info("Executing mutation with operations", {
        operations: JSON.stringify(operations),
      });

      // mutateResources 메서드 사용 - 타입 캐스팅
      mutateResponse = await customer.mutateResources(operations);

      log.info("Mutation response", {
        response: JSON.stringify(mutateResponse),
      });
    } catch (mutateError) {
      const error = mutateError as {
        message?: string;
        details?: unknown;
        errors?: unknown;
      };

      log.error("Mutation error details", {
        error: mutateError,
        message: error?.message,
        details: error?.details,
        errors: error?.errors,
      });
      throw mutateError;
    }

    log.info("Campaign status updated successfully", {
      customerId,
      campaignId,
      status,
    });

    return { success: true };
  } catch (error) {
    // 더 자세한 에러 정보 로깅
    const err = error as {
      message?: string;
      code?: string;
      details?: unknown;
      errors?: Array<{ message: string }>;
      response?: unknown;
      stack?: string;
    };
    const errorDetails = {
      message: err?.message || "Unknown error",
      code: err?.code,
      details: err?.details,
      errors: err?.errors,
      response: err?.response,
      stack: err?.stack,
    };

    log.error("Failed to update campaign status", {
      customerId,
      campaignId,
      status,
      error: errorDetails,
    });

    // Google Ads API 특정 에러 메시지 파싱
    let errorMessage = "캠페인 상태 업데이트 실패";

    if (err?.errors && err.errors.length > 0) {
      errorMessage = err.errors.map((e) => e.message).join(", ");
    } else if (err?.message) {
      errorMessage = err.message;
    }

    return { success: false, error: errorMessage, details: errorDetails };
  }
}

// Google Ads 캠페인 성과 메트릭 조회
export async function fetchCampaignMetrics(
  credentials: GoogleAdsTestCredentials,
  customerId: string,
  campaignId: string,
  dateRange: "LAST_7_DAYS" | "LAST_30_DAYS" | "LAST_90_DAYS" = "LAST_30_DAYS",
): Promise<{
  success: boolean;
  metrics?: {
    date: string;
    impressions: string;
    clicks: string;
    costMicros: string;
    conversions: string;
    ctr: string;
    averageCpc: string;
  }[];
  error?: string;
}> {
  try {
    const { customer } = createGoogleAdsClient(credentials, customerId);

    const query = `
      SELECT
        segments.date,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.ctr,
        metrics.average_cpc
      FROM campaign
      WHERE campaign.id = ${campaignId}
        AND segments.date DURING ${dateRange}
      ORDER BY segments.date DESC
    `;

    const response: GoogleAdsQueryResponseRow[] = await customer.query(query);

    const metrics = response.map((row) => ({
      date: row.segments?.date || "",
      impressions: row.metrics?.impressions || "0",
      clicks: row.metrics?.clicks || "0",
      costMicros: row.metrics?.cost_micros || "0",
      conversions: row.metrics?.conversions || "0",
      ctr: row.metrics?.ctr || "0",
      averageCpc: row.metrics?.average_cpc || "0",
    }));

    log.info(
      `Fetched ${metrics.length} days of metrics for campaign ${campaignId}`,
    );

    return { success: true, metrics };
  } catch (error) {
    log.error("Failed to fetch campaign metrics", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "캠페인 메트릭 조회 실패",
    };
  }
}
