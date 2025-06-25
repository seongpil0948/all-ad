import log from "@/utils/logger";
import { createClient } from "@/utils/supabase/server";

interface TokenExchangeParams {
  subjectToken: string;
  audience: string;
  scope?: string;
}

interface ExchangedToken {
  access_token: string;
  token_type: string;
  expires_in?: number;
  scope?: string;
}

/**
 * OAuth 2.0 Token Exchange (RFC 8693) 구현
 * 단일 사용자 토큰을 여러 서비스별 토큰으로 교환하여
 * 반복적인 인증 없이 여러 플랫폼에 접근 가능
 */
export class TokenExchangeService {
  private tokenCache = new Map<string, { token: string; expiresAt: number }>();

  /**
   * 사용자는 한 번만 인증
   * 초기 OAuth 플로우를 통해 마스터 토큰 획득
   */
  async getUserAuthentication(): Promise<string> {
    const supabase = await createClient();

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) {
      throw new Error("사용자 인증 세션을 찾을 수 없습니다");
    }

    return session.access_token;
  }

  /**
   * 플랫폼은 필요에 따라 서비스별 토큰으로 교환
   * RFC 8693 Token Exchange 사양 구현
   */
  async exchangeToken(params: TokenExchangeParams): Promise<string> {
    const cacheKey = `${params.audience}:${params.scope || "default"}`;

    // 캐시된 토큰 확인
    const cached = this.tokenCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      log.info("캐시된 교환 토큰 사용", { audience: params.audience });

      return cached.token;
    }

    try {
      // 실제 환경에서는 OAuth 서버의 토큰 교환 엔드포인트를 호출
      // 여기서는 시뮬레이션을 위한 구현
      const response = await this.performTokenExchange(params);

      // 토큰 캐싱
      if (response.expires_in) {
        this.tokenCache.set(cacheKey, {
          token: response.access_token,
          expiresAt: Date.now() + response.expires_in * 1000,
        });
      }

      log.info("토큰 교환 성공", {
        audience: params.audience,
        scope: params.scope,
      });

      return response.access_token;
    } catch (error) {
      log.error("토큰 교환 실패", { error, params });
      throw error;
    }
  }

  /**
   * 여러 서비스의 토큰을 병렬로 획득
   * 사용자는 한 번만 인증하고 모든 플랫폼에 접근 가능
   */
  async getServiceTokens(userToken: string): Promise<{
    googleAdsToken: string;
    facebookAdsToken: string;
    tiktokAdsToken: string;
  }> {
    const [googleAdsToken, facebookAdsToken, tiktokAdsToken] =
      await Promise.all([
        this.exchangeToken({
          subjectToken: userToken,
          audience: "https://www.googleapis.com/auth/adwords",
          scope: "https://www.googleapis.com/auth/adwords",
        }),
        this.exchangeToken({
          subjectToken: userToken,
          audience: "https://graph.facebook.com",
          scope: "ads_management,business_management",
        }),
        this.exchangeToken({
          subjectToken: userToken,
          audience: "https://business-api.tiktok.com",
          scope: "ad_account_read,ad_account_write",
        }),
      ]);

    return { googleAdsToken, facebookAdsToken, tiktokAdsToken };
  }

  /**
   * 토큰 교환 수행 (실제 구현)
   * 프로덕션에서는 OAuth 서버의 /token 엔드포인트를 호출
   */
  private async performTokenExchange(
    params: TokenExchangeParams,
  ): Promise<ExchangedToken> {
    // 실제 구현에서는 OAuth 서버로 요청
    // POST /token
    // Content-Type: application/x-www-form-urlencoded
    //
    // grant_type=urn:ietf:params:oauth:grant-type:token-exchange
    // &subject_token={params.subjectToken}
    // &subject_token_type=urn:ietf:params:oauth:token-type:access_token
    // &audience={params.audience}
    // &scope={params.scope}

    // 여기서는 시뮬레이션을 위해 플랫폼별 토큰 생성
    const platformTokens: Record<string, string> = {
      "https://www.googleapis.com/auth/adwords": await this.getGoogleAdsToken(
        params.subjectToken,
      ),
      "https://graph.facebook.com": await this.getMetaAdsToken(
        params.subjectToken,
      ),
      "https://business-api.tiktok.com": await this.getTikTokAdsToken(
        params.subjectToken,
      ),
    };

    const token = platformTokens[params.audience];

    if (!token) {
      throw new Error(`지원하지 않는 audience: ${params.audience}`);
    }

    return {
      access_token: token,
      token_type: "Bearer",
      expires_in: 3600, // 1시간
      scope: params.scope,
    };
  }

  /**
   * Google Ads 토큰 획득 (시뮬레이션)
   * 실제로는 Google OAuth 서버와 통신
   */
  private async getGoogleAdsToken(_subjectToken: string): Promise<string> {
    // 실제 구현에서는 Google OAuth 서버로 토큰 교환 요청
    const supabase = await createClient();

    const { data } = await supabase
      .from("platform_credentials")
      .select("credentials")
      .eq("platform", "google_ads")
      .single();

    return data?.credentials?.refresh_token || `google_ads_token_${Date.now()}`;
  }

  /**
   * Meta Ads 토큰 획득 (시뮬레이션)
   * 실제로는 Facebook OAuth 서버와 통신
   */
  private async getMetaAdsToken(_subjectToken: string): Promise<string> {
    // 실제 구현에서는 Facebook OAuth 서버로 토큰 교환 요청
    const supabase = await createClient();

    const { data } = await supabase
      .from("platform_credentials")
      .select("credentials")
      .eq("platform", "meta_ads")
      .single();

    return data?.credentials?.access_token || `meta_ads_token_${Date.now()}`;
  }

  /**
   * TikTok Ads 토큰 획득 (시뮬레이션)
   * 실제로는 TikTok OAuth 서버와 통신
   */
  private async getTikTokAdsToken(_subjectToken: string): Promise<string> {
    // 실제 구현에서는 TikTok OAuth 서버로 토큰 교환 요청
    const supabase = await createClient();

    const { data } = await supabase
      .from("platform_credentials")
      .select("credentials")
      .eq("platform", "tiktok_ads")
      .single();

    return data?.credentials?.access_token || `tiktok_ads_token_${Date.now()}`;
  }

  /**
   * 토큰 갱신이 필요한지 확인
   * 만료 5분 전에 갱신 시작
   */
  isTokenExpiring(token: string, audience: string): boolean {
    const cacheKey = `${audience}:default`;
    const cached = this.tokenCache.get(cacheKey);

    if (!cached) return true;

    const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000;

    return cached.expiresAt < fiveMinutesFromNow;
  }

  /**
   * 캐시된 토큰 제거
   */
  clearTokenCache(audience?: string) {
    if (audience) {
      const keysToDelete = Array.from(this.tokenCache.keys()).filter((key) =>
        key.startsWith(audience),
      );

      keysToDelete.forEach((key) => this.tokenCache.delete(key));
    } else {
      this.tokenCache.clear();
    }

    log.info("토큰 캐시 삭제", { audience });
  }
}
