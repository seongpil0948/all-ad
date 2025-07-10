"use server";

import log from "@/utils/logger";
import { MetaAdsIntegrationService } from "@/services/meta-ads/meta-ads-integration.service";

export interface MetaAdsTestCredentials {
  appId: string;
  appSecret: string;
  accessToken: string;
  businessId?: string;
}

// Meta Ads OAuth URL 생성
export async function generateMetaAuthUrl(
  appId: string,
  redirectUri: string,
  state: string,
) {
  try {
    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      state: state,
      scope:
        "email,ads_management,ads_read,business_management,pages_read_engagement,pages_manage_ads",
      response_type: "code",
      auth_type: "rerequest",
      display: "popup",
    });

    const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;

    log.info("Meta Auth URL generated", { appId });

    return { success: true, authUrl };
  } catch (error) {
    log.error("Failed to generate Meta auth URL", error);

    return { success: false, error: "인증 URL 생성 실패" };
  }
}

// Meta Ads 토큰 교환 (별칭 추가)
export async function exchangeMetaToken(
  code: string,
  appId: string,
  appSecret: string,
  redirectUri: string,
) {
  return exchangeMetaCodeForToken(code, appId, appSecret, redirectUri);
}

// Meta Ads 토큰 교환
export async function exchangeMetaCodeForToken(
  code: string,
  appId: string,
  appSecret: string,
  redirectUri: string,
) {
  try {
    log.info("Exchanging Meta code for token", { appId, redirectUri });

    const params = new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: redirectUri,
      code: code,
    });

    const tokenResponse = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?${params}`,
    );

    const data = await tokenResponse.json();

    if (!tokenResponse.ok || data.error) {
      log.error("Meta token exchange failed", { error: data.error });
      throw new Error(
        data.error?.message || "Failed to exchange code for token",
      );
    }

    log.info("Meta token exchange successful");

    return {
      success: true,
      accessToken: data.access_token,
      tokenType: data.token_type,
      expiresIn: data.expires_in,
    };
  } catch (error) {
    log.error("Failed to exchange Meta code for token", error);

    return { success: false, error: "토큰 교환 실패" };
  }
}

// Meta Ads 계정 목록 가져오기
export async function fetchMetaAdsAccounts(
  credentials: MetaAdsTestCredentials,
): Promise<{
  success: boolean;
  accounts?: Array<{
    id: string;
    name: string;
    accountId: string;
    currency: string;
    status: number;
    timezone: string;
  }>;
  error?: string;
}> {
  try {
    const service = new MetaAdsIntegrationService({
      appId: credentials.appId,
      appSecret: credentials.appSecret,
      accessToken: credentials.accessToken,
    });

    const accounts = await service.getAdAccounts();

    if (!accounts || accounts.length === 0) {
      log.info("No Meta Ads accounts found");
    }

    // Transform the response data to match the expected format
    const transformedAccounts = accounts.map((account) => ({
      id: account.id,
      name: account.name,
      accountId: account.id, // Using id as accountId
      currency: account.currency,
      status: account.status,
      timezone: account.timezone || "UTC", // Add timezone with default
    }));

    return {
      success: true,
      accounts: transformedAccounts,
    };
  } catch (error) {
    log.error("Failed to fetch Meta Ads accounts", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "계정 목록 조회 실패",
    };
  }
}

// Meta Ads 캠페인 목록 가져오기
export async function fetchMetaCampaigns(
  credentials: MetaAdsTestCredentials,
  accountId: string,
): Promise<{
  success: boolean;
  campaigns?: Array<{
    id: string;
    name: string;
    status: string;
    objective?: string;
    dailyBudget?: number;
    lifetimeBudget?: number;
  }>;
  error?: string;
}> {
  try {
    const service = new MetaAdsIntegrationService({
      appId: credentials.appId,
      appSecret: credentials.appSecret,
      accessToken: credentials.accessToken,
    });

    const campaigns = await service.getCampaigns(accountId);

    if (!campaigns || campaigns.length === 0) {
      log.info("No Meta campaigns found for account", { accountId });
    }

    return { success: true, campaigns };
  } catch (error) {
    log.error("Failed to fetch Meta campaigns", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "캠페인 목록 조회 실패",
    };
  }
}

// Meta 캠페인 상태 업데이트
export async function updateMetaCampaignStatus(
  credentials: MetaAdsTestCredentials,
  campaignId: string,
  status: "ACTIVE" | "PAUSED",
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const service = new MetaAdsIntegrationService({
      appId: credentials.appId,
      appSecret: credentials.appSecret,
      accessToken: credentials.accessToken,
    });

    const success = await service.updateCampaignStatus(campaignId, status);

    if (!success) {
      throw new Error("Failed to update campaign status");
    }

    return { success: true };
  } catch (error) {
    log.error("Failed to update Meta campaign status", error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "캠페인 상태 업데이트 실패",
    };
  }
}

// Meta 캠페인 일괄 상태 업데이트
export async function batchUpdateMetaCampaignStatus(
  credentials: MetaAdsTestCredentials,
  updates: Array<{ campaignId: string; status: "ACTIVE" | "PAUSED" }>,
): Promise<{
  success: boolean;
  results?: Array<{ campaignId: string; success: boolean; error?: string }>;
  error?: string;
}> {
  try {
    const results = await Promise.all(
      updates.map(async ({ campaignId, status }) => {
        try {
          const result = await updateMetaCampaignStatus(
            credentials,
            campaignId,
            status,
          );

          return { campaignId, success: result.success, error: result.error };
        } catch (error) {
          return {
            campaignId,
            success: false,
            error: error instanceof Error ? error.message : "업데이트 실패",
          };
        }
      }),
    );

    const hasErrors = results.some((r) => !r.success);

    return {
      success: !hasErrors,
      results,
    };
  } catch (error) {
    log.error("Failed to batch update Meta campaign status", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "일괄 업데이트 실패",
    };
  }
}

// Meta 캐시 초기화
export async function clearMetaCache(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    log.info("Meta cache clear requested");

    // 실제 캐시 초기화 로직은 서비스에 구현되어야 함
    // 현재는 placeholder로 성공 반환
    return { success: true };
  } catch (error) {
    log.error("Failed to clear Meta cache", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "캐시 초기화 실패",
    };
  }
}
