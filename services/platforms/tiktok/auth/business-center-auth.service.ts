import { createClient } from "@/utils/supabase/server";
import log from "@/utils/logger";

interface TikTokBusinessCredentials {
  businessCenterId: string;
  accessToken: string;
  appId: string;
  appSecret: string;
}

interface BusinessCenterInfo {
  bc_id: string;
  bc_name: string;
  bc_status: string;
  member_count: number;
}

export class TikTokBusinessCenterAuthService {
  private baseUrl = "https://business-api.tiktok.com/open_api/v1.3";

  /**
   * TikTok Business Center 인증
   * 세분화된 권한 제어와 함께 최대 4,000명의 멤버 관리 가능
   */
  async authenticateBusinessCenter(credentials: TikTokBusinessCredentials) {
    try {
      // Business Center 정보 확인
      const bcInfo = await this.getBusinessCenterInfo(
        credentials.accessToken,
        credentials.businessCenterId,
      );

      if (!bcInfo || bcInfo.bc_status !== "ENABLE") {
        throw new Error("유효하지 않은 Business Center입니다");
      }

      // DB에 Business Center 정보 저장
      await this.saveBusinessCenterCredentials(credentials, bcInfo);

      log.info("TikTok Business Center 인증 성공", {
        businessCenterId: credentials.businessCenterId,
        memberCount: bcInfo.member_count,
      });

      return bcInfo;
    } catch (error) {
      log.error("TikTok Business Center 인증 실패", { error });
      throw error;
    }
  }

  /**
   * QR 코드 기반 클라이언트 온보딩
   * 클라이언트가 QR 코드를 스캔하여 쉽게 계정 연결
   */
  async generateOnboardingQRCode(
    businessCenterId: string,
    accessToken: string,
  ): Promise<string> {
    try {
      const response = await fetch(
        `${this.baseUrl}/bc/invite/qr_code/create/`,
        {
          method: "POST",
          headers: {
            "Access-Token": accessToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bc_id: businessCenterId,
            permission_type: "ADVERTISER_PERMISSION",
            permissions: ["AD_ACCOUNT_READ", "AD_ACCOUNT_WRITE"],
            expire_time: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7일
          }),
        },
      );

      const result = await response.json();

      if (result.code !== 0) {
        throw new Error(`QR 코드 생성 실패: ${result.message}`);
      }

      log.info("온보딩 QR 코드 생성 성공", {
        businessCenterId,
        qrCodeUrl: result.data.qr_code_url,
      });

      return result.data.qr_code_url;
    } catch (error) {
      log.error("QR 코드 생성 실패", { error });
      throw error;
    }
  }

  /**
   * Business Center에 연결된 광고 계정 목록 조회
   */
  async listAdAccounts(businessCenterId: string, accessToken: string) {
    try {
      const params = new URLSearchParams({
        bc_id: businessCenterId,
        asset_type: "ADVERTISER",
        page: "1",
        page_size: "100",
      });

      const response = await fetch(`${this.baseUrl}/bc/asset/get/?${params}`, {
        method: "GET",
        headers: {
          "Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (result.code !== 0) {
        throw new Error(`광고 계정 조회 실패: ${result.message}`);
      }

      log.info("광고 계정 목록 조회 성공", {
        businessCenterId,
        accountCount: result.data.list?.length || 0,
      });

      return result.data.list || [];
    } catch (error) {
      log.error("광고 계정 목록 조회 실패", { error });
      throw error;
    }
  }

  /**
   * Business Center 정보 조회
   */
  private async getBusinessCenterInfo(
    accessToken: string,
    businessCenterId: string,
  ): Promise<BusinessCenterInfo> {
    try {
      const params = new URLSearchParams({
        bc_id: businessCenterId,
      });

      const response = await fetch(`${this.baseUrl}/bc/get/?${params}`, {
        method: "GET",
        headers: {
          "Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (result.code !== 0) {
        throw new Error(`Business Center 정보 조회 실패: ${result.message}`);
      }

      return result.data;
    } catch (error) {
      log.error("Business Center 정보 조회 실패", { error });
      throw error;
    }
  }

  /**
   * Business Center 정보를 DB에 저장
   */
  private async saveBusinessCenterCredentials(
    credentials: TikTokBusinessCredentials,
    bcInfo: BusinessCenterInfo,
  ) {
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

    // Business Center 정보 저장
    const { error } = await supabase.from("platform_credentials").upsert(
      {
        team_id: teamMember.team_id,
        platform: "tiktok_ads",
        account_id: credentials.businessCenterId,
        credentials: {
          business_center_id: credentials.businessCenterId,
          business_center_name: bcInfo.bc_name,
          access_token: credentials.accessToken,
          app_id: credentials.appId,
          app_secret: credentials.appSecret,
          member_count: bcInfo.member_count,
          is_business_center: true,
          // TikTok 토큰은 24시간 수명
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "team_id,platform,account_id",
      },
    );

    if (error) {
      log.error("Business Center 정보 저장 실패", { error });
      throw error;
    }

    log.info("Business Center 정보 저장 성공", {
      teamId: teamMember.team_id,
      businessCenterId: credentials.businessCenterId,
    });
  }

  /**
   * DB에서 Business Center 정보 로드
   */
  async loadBusinessCenterCredentials(
    teamId: string,
  ): Promise<TikTokBusinessCredentials | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("platform_credentials")
      .select("*")
      .eq("team_id", teamId)
      .eq("platform", "tiktok_ads")
      .eq("credentials->>is_business_center", "true")
      .single();

    if (error || !data) {
      log.info("Business Center 정보를 찾을 수 없습니다", { teamId });

      return null;
    }

    const creds = data.credentials as any;

    return {
      businessCenterId: creds.business_center_id,
      accessToken: creds.access_token,
      appId: creds.app_id,
      appSecret: creds.app_secret,
    };
  }

  /**
   * 토큰 갱신 (TikTok은 24시간마다 갱신 필요)
   */
  async refreshAccessToken(
    appId: string,
    appSecret: string,
    refreshToken: string,
  ): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/oauth2/refresh_token/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          app_id: appId,
          secret: appSecret,
          refresh_token: refreshToken,
        }),
      });

      const result = await response.json();

      if (result.code !== 0) {
        throw new Error(`토큰 갱신 실패: ${result.message}`);
      }

      log.info("TikTok 토큰 갱신 성공");

      return result.data.access_token;
    } catch (error) {
      log.error("TikTok 토큰 갱신 실패", { error });
      throw error;
    }
  }

  /**
   * 광고 계정별 캠페인 조회
   * Business Center 권한으로 개별 인증 없이 접근
   */
  async getAdAccountCampaigns(accessToken: string, advertiserId: string) {
    try {
      const params = new URLSearchParams({
        advertiser_id: advertiserId,
        page: "1",
        page_size: "100",
        fields: JSON.stringify([
          "campaign_id",
          "campaign_name",
          "status",
          "objective_type",
          "budget",
          "budget_mode",
        ]),
      });

      const response = await fetch(`${this.baseUrl}/campaign/get/?${params}`, {
        method: "GET",
        headers: {
          "Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (result.code !== 0) {
        throw new Error(`캠페인 조회 실패: ${result.message}`);
      }

      log.info("광고 계정 캠페인 조회 성공", {
        advertiserId,
        campaignCount: result.data.list?.length || 0,
      });

      return result.data.list || [];
    } catch (error) {
      log.error("광고 계정 캠페인 조회 실패", { error });
      throw error;
    }
  }

  /**
   * Enterprise Business Center 기능 확인
   * Enterprise는 더 많은 기능과 한도 제공
   */
  async checkEnterpriseFeatures(
    accessToken: string,
    businessCenterId: string,
  ): Promise<boolean> {
    try {
      const bcInfo = await this.getBusinessCenterInfo(
        accessToken,
        businessCenterId,
      );

      // Enterprise Business Center는 더 많은 멤버와 기능 지원
      const isEnterprise =
        bcInfo.member_count > 1000 || bcInfo.bc_status === "ENTERPRISE";

      log.info("Enterprise 기능 확인", {
        businessCenterId,
        isEnterprise,
        memberCount: bcInfo.member_count,
      });

      return isEnterprise;
    } catch (error) {
      log.error("Enterprise 기능 확인 실패", { error });

      return false;
    }
  }
}
