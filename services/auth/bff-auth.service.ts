import { GoogleMCCAuthService } from "../platforms/google/auth/mcc-auth.service";
import { MetaSystemUserAuthService } from "../platforms/meta/auth/system-user-auth.service";

import { TokenExchangeService } from "./token-exchange.service";

import log from "@/utils/logger";
import { createClient } from "@/utils/supabase/server";

interface Credential {
  id: string;
  team_id: string;
  platform: string;
  credentials: {
    is_mcc?: boolean;
    is_system_user?: boolean;
    developer_token?: string;
    refresh_token?: string;
    login_customer_id?: string;
    access_token?: string;
    client_id?: string;
    client_secret?: string;
  };
  data?: {
    token_expires_at?: string;
  };
}

interface UnifiedData {
  google?: Record<string, unknown> | null;
  meta?: Record<string, unknown> | null;
  tiktok?: Record<string, unknown> | null;
  error?: string;
}

interface TokenSet {
  google?: string;
  meta?: string;
  tiktok?: string;
}

/**
 * Backend for Frontend (BFF) 패턴으로 인증 복잡성 중앙화
 * 클라이언트는 단순한 인터페이스만 사용하고
 * 모든 토큰 관리는 BFF가 내부적으로 처리
 */
export class BFFAuthService {
  private tokenExchange: TokenExchangeService;
  private googleMCCAuth: GoogleMCCAuthService;
  private metaSystemUserAuth: MetaSystemUserAuthService;

  constructor() {
    this.tokenExchange = new TokenExchangeService();
    this.googleMCCAuth = new GoogleMCCAuthService();
    this.metaSystemUserAuth = new MetaSystemUserAuthService();
  }

  /**
   * 통합 데이터 조회 - 클라이언트는 이 메서드만 호출
   * BFF가 내부적으로 모든 토큰 관리를 처리
   */
  async getUnifiedData(userId: string, tenantId: string): Promise<UnifiedData> {
    try {
      // BFF가 내부적으로 모든 토큰 관리를 처리
      const tokens = await this.refreshTokensIfNeeded(userId, tenantId);

      // 적절한 토큰으로 병렬 데이터 가져오기
      const [googleData, metaData, tiktokData] = await Promise.all([
        this.fetchGoogleAdsData(tokens.google),
        this.fetchMetaAdsData(tokens.meta),
        this.fetchTikTokAdsData(tokens.tiktok),
      ]);

      return this.combineResults(googleData, metaData, tiktokData);
    } catch (error) {
      log.error("통합 데이터 조회 실패", { userId, tenantId, error });

      return { error: "데이터를 가져오는 중 오류가 발생했습니다" };
    }
  }

  /**
   * 토큰 자동 갱신 관리
   * 클라이언트는 토큰 만료를 신경쓰지 않아도 됨
   */
  private async refreshTokensIfNeeded(
    userId: string,
    tenantId: string,
  ): Promise<TokenSet> {
    const supabase = await createClient();

    // 저장된 토큰 정보 조회
    const { data: credentials } = await supabase
      .from("platform_credentials")
      .select("*")
      .eq("team_id", tenantId);

    const tokens: TokenSet = {};

    // 각 플랫폼별 토큰 확인 및 갱신
    for (const cred of credentials || []) {
      switch (cred.platform) {
        case "google_ads":
          tokens.google = await this.handleGoogleToken(cred);
          break;
        case "meta_ads":
          tokens.meta = await this.handleMetaToken(cred);
          break;
        case "tiktok_ads":
          tokens.tiktok = await this.handleTikTokToken(cred);
          break;
      }
    }

    return tokens;
  }

  /**
   * Google Ads 토큰 처리 - MCC 계정 활용
   */
  private async handleGoogleToken(
    credential: Credential,
  ): Promise<string | undefined> {
    try {
      if (credential.credentials?.is_mcc) {
        // MCC 계정인 경우 재사용
        await this.googleMCCAuth.authenticateMCC({
          developerToken: credential.credentials.developer_token || "",
          refreshToken: credential.credentials.refresh_token || "",
          loginCustomerId: credential.credentials.login_customer_id || "",
        });

        return credential.credentials.refresh_token;
      }

      // 일반 계정인 경우 토큰 갱신 필요 시 처리
      if (this.isTokenExpiring(credential)) {
        return await this.refreshGoogleToken(credential);
      }

      return credential.credentials.refresh_token;
    } catch (error) {
      log.error("Google 토큰 처리 실패", { error });

      return undefined;
    }
  }

  /**
   * Meta Ads 토큰 처리 - 시스템 사용자 활용
   */
  private async handleMetaToken(
    credential: Credential,
  ): Promise<string | undefined> {
    try {
      if (credential.credentials?.is_system_user) {
        // 시스템 사용자 토큰은 만료되지 않음
        return credential.credentials.access_token;
      }

      // 일반 사용자 토큰인 경우 만료 확인
      if (this.isTokenExpiring(credential)) {
        return await this.refreshMetaToken(credential);
      }

      return credential.credentials.access_token;
    } catch (error) {
      log.error("Meta 토큰 처리 실패", { error });

      return undefined;
    }
  }

  /**
   * TikTok 토큰 처리
   */
  private async handleTikTokToken(
    credential: Credential,
  ): Promise<string | undefined> {
    try {
      // TikTok은 24시간 토큰 수명이므로 자주 갱신 필요
      if (this.isTokenExpiring(credential, 24 * 60 * 60 * 1000)) {
        return await this.refreshTikTokToken(credential);
      }

      return credential.credentials.access_token;
    } catch (error) {
      log.error("TikTok 토큰 처리 실패", { error });

      return undefined;
    }
  }

  /**
   * 토큰 만료 여부 확인
   */
  private isTokenExpiring(
    credential: Credential,
    bufferTime: number = 5 * 60 * 1000, // 기본 5분
  ): boolean {
    const expiresAt = credential.data?.token_expires_at;

    if (!expiresAt) return false;

    const expirationTime = new Date(expiresAt).getTime();

    return Date.now() + bufferTime > expirationTime;
  }

  /**
   * Google Ads 데이터 가져오기
   */
  private async fetchGoogleAdsData(token?: string): Promise<
    | {
        accountId: string;
        accountName: string;
        campaigns: unknown[];
      }[]
    | null
  > {
    if (!token) return null;

    try {
      // MCC를 통해 모든 클라이언트 계정 데이터 조회
      const accounts = await this.googleMCCAuth.listClientAccounts();
      const allCampaigns = [];

      for (const account of accounts) {
        if (!account.customer_client || !account.customer_client.id) continue;

        const campaigns = await this.googleMCCAuth.getClientCampaigns(
          String(account.customer_client.id),
        );

        allCampaigns.push({
          accountId: String(account.customer_client.id),
          accountName: account.customer_client.descriptive_name || "",
          campaigns,
        });
      }

      return allCampaigns;
    } catch (error) {
      log.error("Google Ads 데이터 조회 실패", { error });

      return null;
    }
  }

  /**
   * Meta Ads 데이터 가져오기
   */
  private async fetchMetaAdsData(
    token?: string,
  ): Promise<Record<string, unknown> | null> {
    if (!token) return null;

    try {
      // 시스템 사용자를 통해 모든 광고 계정 데이터 조회
      const credentials =
        await this.metaSystemUserAuth.loadSystemUserCredentials(
          "current_team_id", // 실제로는 컨텍스트에서 가져옴
        );

      if (!credentials) return null;

      const accounts = await this.metaSystemUserAuth.listAdAccounts(
        credentials.accessToken,
        credentials.businessId,
      );

      const allCampaigns = [];

      for (const account of accounts) {
        const campaigns = await this.metaSystemUserAuth.getAdAccountCampaigns(
          credentials.accessToken,
          account.id,
        );

        allCampaigns.push({
          accountId: account.id,
          accountName: account.name,
          campaigns,
        });
      }

      return { accounts: allCampaigns } as Record<string, unknown>;
    } catch (error) {
      log.error("Meta Ads 데이터 조회 실패", { error });

      return null;
    }
  }

  /**
   * TikTok Ads 데이터 가져오기
   */
  private async fetchTikTokAdsData(
    token?: string,
  ): Promise<Record<string, unknown> | null> {
    if (!token) return null;

    // TikTok Business Center API 호출
    // 실제 구현은 TikTok API 문서 참조
    return {
      accounts: [],
      campaigns: [],
    };
  }

  /**
   * 플랫폼별 데이터 통합
   */
  private combineResults(
    googleData:
      | { accountId: string; accountName: string; campaigns: unknown[] }[]
      | null,
    metaData: Record<string, unknown> | null,
    tiktokData: Record<string, unknown> | null,
  ): UnifiedData {
    const processedGoogleData = googleData ? { accounts: googleData } : null;

    return {
      google: processedGoogleData,
      meta: metaData,
      tiktok: tiktokData,
    };
  }

  /**
   * Google 토큰 갱신
   */
  private async refreshGoogleToken(credential: Credential): Promise<string> {
    // Google OAuth2 토큰 갱신 로직
    // 실제 구현은 Google OAuth2 문서 참조
    log.info("Google 토큰 갱신", { credentialId: credential.id });

    return `refreshed_google_token_${Date.now()}`;
  }

  /**
   * Meta 토큰 갱신
   */
  private async refreshMetaToken(credential: Credential): Promise<string> {
    // Meta OAuth2 토큰 갱신 로직
    // 실제 구현은 Meta OAuth2 문서 참조
    log.info("Meta 토큰 갱신", { credentialId: credential.id });

    return `refreshed_meta_token_${Date.now()}`;
  }

  /**
   * TikTok 토큰 갱신
   */
  private async refreshTikTokToken(credential: Credential): Promise<string> {
    // TikTok OAuth2 토큰 갱신 로직
    // 실제 구현은 TikTok OAuth2 문서 참조
    log.info("TikTok 토큰 갱신", { credentialId: credential.id });

    return `refreshed_tiktok_token_${Date.now()}`;
  }

  /**
   * 팀 협업을 위한 임시 접근 토큰 생성
   * Supermetrics 방식의 공유 가능한 인증 링크
   */
  async generateShareableAuthLink(
    requesterId: string,
    targetAccountId: string,
    platform: string,
    expiresIn: number = 24 * 60 * 60 * 1000, // 24시간
  ): Promise<string> {
    const supabase = await createClient();

    // 임시 토큰 생성
    const tempToken = `temp_${platform}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + expiresIn);

    // DB에 임시 토큰 저장
    const { error } = await supabase.from("temp_auth_tokens").insert({
      token: tempToken,
      requester_id: requesterId,
      target_account_id: targetAccountId,
      platform: platform,
      expires_at: expiresAt.toISOString(),
      status: "pending",
    });

    if (error) {
      log.error("임시 토큰 생성 실패", { error });
      throw error;
    }

    // 공유 가능한 링크 생성
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    const authLink = `${baseUrl}/auth/share/${tempToken}`;

    log.info("공유 가능한 인증 링크 생성", {
      requesterId,
      targetAccountId,
      platform,
      expiresAt,
    });

    return authLink;
  }
}
