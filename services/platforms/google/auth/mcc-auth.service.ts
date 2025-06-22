import { GoogleAdsApi } from "google-ads-api";

import { createClient } from "@/utils/supabase/server";
import log from "@/utils/logger";
import { GoogleAdsCredentials } from "@/types/google-ads.types";

export class GoogleMCCAuthService {
  private mccClient?: GoogleAdsApi;
  private mccRefreshToken?: string;
  private mccAccountId?: string;

  /**
   * MCC 계정에 대한 단일 OAuth 인증으로 모든 클라이언트 계정에 접근
   * MCC 계정은 최대 85,000개의 비관리자 계정을 지원
   */
  async authenticateMCC(credentials: {
    developerToken: string;
    refreshToken: string; // MCC용 단일 토큰
    loginCustomerId: string; // MCC 계정 ID
  }) {
    try {
      // MCC 인증 후 클라이언트 계정 접근
      this.mccClient = new GoogleAdsApi({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_ADS_CLIENT_ID!,
        client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
        developer_token: credentials.developerToken,
      });

      this.mccRefreshToken = credentials.refreshToken;
      this.mccAccountId = credentials.loginCustomerId;

      log.info("MCC 계정 인증 성공", { mccAccountId: this.mccAccountId });

      // MCC 계정 정보를 DB에 저장
      await this.saveMCCCredentials(credentials);

      return this.mccClient;
    } catch (error) {
      log.error("MCC 계정 인증 실패", { error });
      throw error;
    }
  }

  /**
   * 재인증 없이 클라이언트 계정 접근
   * MCC 계정의 refresh token을 사용하여 모든 하위 계정에 접근 가능
   */
  async accessClientAccount(clientAccountId: string) {
    if (!this.mccClient || !this.mccRefreshToken || !this.mccAccountId) {
      throw new Error("MCC 계정이 인증되지 않았습니다");
    }

    try {
      const customer = this.mccClient.Customer({
        customer_id: clientAccountId,
        refresh_token: this.mccRefreshToken,
        login_customer_id: this.mccAccountId,
      });

      log.info("클라이언트 계정 접근 성공", { clientAccountId });

      return customer;
    } catch (error) {
      log.error("클라이언트 계정 접근 실패", { clientAccountId, error });
      throw error;
    }
  }

  /**
   * MCC 계정에 연결된 모든 클라이언트 계정 목록 조회
   */
  async listClientAccounts() {
    if (!this.mccClient || !this.mccRefreshToken || !this.mccAccountId) {
      throw new Error("MCC 계정이 인증되지 않았습니다");
    }

    try {
      const customer = this.mccClient.Customer({
        customer_id: this.mccAccountId,
        refresh_token: this.mccRefreshToken,
        login_customer_id: this.mccAccountId,
      });

      // MCC 계정에 연결된 모든 계정 조회
      const query = `
        SELECT
          customer_client.id,
          customer_client.descriptive_name,
          customer_client.currency_code,
          customer_client.time_zone,
          customer_client.manager,
          customer_client.status
        FROM customer_client
        WHERE customer_client.status = 'ENABLED'
        ORDER BY customer_client.id
      `;

      const result = await customer.query(query);

      log.info("클라이언트 계정 목록 조회 성공", {
        count: result.length,
      });

      return result;
    } catch (error) {
      log.error("클라이언트 계정 목록 조회 실패", { error });
      throw error;
    }
  }

  /**
   * MCC 계정 정보를 DB에 저장
   */
  private async saveMCCCredentials(credentials: {
    developerToken: string;
    refreshToken: string;
    loginCustomerId: string;
  }) {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("사용자 인증 정보를 가져올 수 없습니다");
    }

    // 사용자의 팀 ID 조회
    const { data: teamMember, error: teamError } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .single();

    if (teamError || !teamMember) {
      throw new Error("팀 정보를 찾을 수 없습니다");
    }

    // MCC 계정 정보 저장
    const { error } = await supabase.from("platform_credentials").upsert(
      {
        team_id: teamMember.team_id,
        platform: "google_ads",
        account_id: credentials.loginCustomerId,
        credentials: {
          developer_token: credentials.developerToken,
          refresh_token: credentials.refreshToken,
          login_customer_id: credentials.loginCustomerId,
          is_mcc: true,
        },
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "team_id,platform,account_id",
      },
    );

    if (error) {
      log.error("MCC 계정 정보 저장 실패", { error });
      throw error;
    }

    log.info("MCC 계정 정보 저장 성공", {
      teamId: teamMember.team_id,
      mccAccountId: credentials.loginCustomerId,
    });
  }

  /**
   * DB에서 MCC 계정 정보 로드
   */
  async loadMCCCredentials(
    teamId: string,
  ): Promise<GoogleAdsCredentials | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("platform_credentials")
      .select("*")
      .eq("team_id", teamId)
      .eq("platform", "google_ads")
      .eq("credentials->>is_mcc", "true")
      .single();

    if (error || !data) {
      log.info("MCC 계정 정보를 찾을 수 없습니다", { teamId });

      return null;
    }

    return data.credentials as GoogleAdsCredentials;
  }

  /**
   * 특정 클라이언트 계정의 캠페인 목록 조회
   * MCC 인증을 통해 개별 인증 없이 접근
   */
  async getClientCampaigns(clientAccountId: string) {
    const customer = await this.accessClientAccount(clientAccountId);

    const query = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.budget.amount_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros
      FROM campaign
      WHERE segments.date DURING LAST_30_DAYS
      AND campaign.status != 'REMOVED'
      ORDER BY campaign.id
    `;

    const campaigns = await customer.query(query);

    log.info("클라이언트 캠페인 조회 성공", {
      clientAccountId,
      campaignCount: campaigns.length,
    });

    return campaigns;
  }
}
