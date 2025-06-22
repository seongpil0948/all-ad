import { createClient } from "@/utils/supabase/server";
import log from "@/utils/logger";

interface SystemUserCredentials {
  systemUserId: string;
  accessToken: string;
  businessId: string;
}

interface BusinessManager {
  id: string;
  name: string;
}

export class MetaSystemUserAuthService {
  private apiVersion = "v18.0";
  private baseUrl = `https://graph.facebook.com/${this.apiVersion}`;

  /**
   * 시스템 사용자를 통한 영구 인증
   * 표준 사용자 토큰과 달리 시스템 사용자 토큰은 만료되지 않음
   */
  async authenticateSystemUser(credentials: SystemUserCredentials) {
    try {
      // 시스템 사용자 토큰 검증
      const isValid = await this.validateSystemUserToken(
        credentials.accessToken,
      );

      if (!isValid) {
        throw new Error("유효하지 않은 시스템 사용자 토큰입니다");
      }

      // DB에 시스템 사용자 정보 저장
      await this.saveSystemUserCredentials(credentials);

      log.info("Meta 시스템 사용자 인증 성공", {
        systemUserId: credentials.systemUserId,
        businessId: credentials.businessId,
      });

      return credentials;
    } catch (error) {
      log.error("Meta 시스템 사용자 인증 실패", { error });
      throw error;
    }
  }

  /**
   * 2단계 Business Manager 패턴으로 정교한 에이전시 설정
   * 부모 Business Manager에서 각 클라이언트를 위한 자식 Business Manager 생성
   */
  async createChildBusinessManager(
    parentSystemUserToken: string,
    clientName: string,
  ): Promise<{ childBM: BusinessManager; systemToken: string }> {
    try {
      // 자식 Business Manager 생성
      const response = await fetch(`${this.baseUrl}/business`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `${clientName} Business Manager`,
          vertical: "ADVERTISING",
          access_token: parentSystemUserToken,
        }),
      });

      if (!response.ok) {
        throw new Error(`Business Manager 생성 실패: ${response.statusText}`);
      }

      const childBM = await response.json();

      // 자식 Business Manager를 위한 시스템 사용자 생성
      const systemToken = await this.generateSystemUserToken({
        business_id: childBM.id,
        scope: ["ads_management", "business_management"],
        access_token: parentSystemUserToken,
      });

      log.info("자식 Business Manager 생성 성공", {
        parentToken: parentSystemUserToken.substring(0, 10) + "...",
        childBMId: childBM.id,
        clientName,
      });

      return { childBM, systemToken };
    } catch (error) {
      log.error("자식 Business Manager 생성 실패", { error });
      throw error;
    }
  }

  /**
   * Business Manager에 연결된 모든 광고 계정 조회
   * Business Manager당 최대 250개의 광고 계정 관리 가능
   */
  async listAdAccounts(systemUserToken: string, businessId: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/${businessId}/owned_ad_accounts?fields=id,name,account_status,currency,timezone_name&access_token=${systemUserToken}`,
      );

      if (!response.ok) {
        throw new Error(`광고 계정 조회 실패: ${response.statusText}`);
      }

      const result = await response.json();

      log.info("광고 계정 목록 조회 성공", {
        businessId,
        accountCount: result.data?.length || 0,
      });

      return result.data || [];
    } catch (error) {
      log.error("광고 계정 목록 조회 실패", { error });
      throw error;
    }
  }

  /**
   * 시스템 사용자를 위한 영구 토큰 생성
   * 이 토큰은 수동으로 취소하지 않는 한 만료되지 않음
   */
  private async generateSystemUserToken(params: {
    business_id: string;
    scope: string[];
    access_token: string;
  }): Promise<string> {
    try {
      // 시스템 사용자 생성
      const createResponse = await fetch(
        `${this.baseUrl}/${params.business_id}/system_users`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: `System User ${Date.now()}`,
            role: "ADMIN",
            access_token: params.access_token,
          }),
        },
      );

      if (!createResponse.ok) {
        throw new Error(
          `시스템 사용자 생성 실패: ${createResponse.statusText}`,
        );
      }

      const systemUser = await createResponse.json();

      // 시스템 사용자 토큰 생성
      const tokenResponse = await fetch(
        `${this.baseUrl}/${systemUser.id}/access_tokens`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            scope: params.scope.join(","),
            access_token: params.access_token,
          }),
        },
      );

      if (!tokenResponse.ok) {
        throw new Error(
          `시스템 사용자 토큰 생성 실패: ${tokenResponse.statusText}`,
        );
      }

      const tokenData = await tokenResponse.json();

      log.info("시스템 사용자 토큰 생성 성공", {
        systemUserId: systemUser.id,
      });

      return tokenData.access_token;
    } catch (error) {
      log.error("시스템 사용자 토큰 생성 실패", { error });
      throw error;
    }
  }

  /**
   * 시스템 사용자 토큰 유효성 검증
   */
  private async validateSystemUserToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/debug_token?input_token=${token}&access_token=${token}`,
      );

      if (!response.ok) {
        return false;
      }

      const result = await response.json();

      // 시스템 사용자 토큰은 expires_at이 0이거나 없음
      return (
        result.data?.is_valid &&
        (!result.data.expires_at || result.data.expires_at === 0)
      );
    } catch (error) {
      log.error("토큰 검증 실패", { error });

      return false;
    }
  }

  /**
   * 시스템 사용자 정보를 DB에 저장
   */
  private async saveSystemUserCredentials(credentials: SystemUserCredentials) {
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

    // 시스템 사용자 정보 저장
    const { error } = await supabase.from("platform_credentials").upsert(
      {
        team_id: teamMember.team_id,
        platform: "meta_ads",
        account_id: credentials.businessId,
        credentials: {
          system_user_id: credentials.systemUserId,
          access_token: credentials.accessToken,
          business_id: credentials.businessId,
          is_system_user: true,
          expires_at: null, // 시스템 사용자 토큰은 만료되지 않음
        },
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "team_id,platform,account_id",
      },
    );

    if (error) {
      log.error("시스템 사용자 정보 저장 실패", { error });
      throw error;
    }

    log.info("시스템 사용자 정보 저장 성공", {
      teamId: teamMember.team_id,
      businessId: credentials.businessId,
    });
  }

  /**
   * DB에서 시스템 사용자 정보 로드
   */
  async loadSystemUserCredentials(
    teamId: string,
  ): Promise<SystemUserCredentials | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("platform_credentials")
      .select("*")
      .eq("team_id", teamId)
      .eq("platform", "meta_ads")
      .eq("credentials->>is_system_user", "true")
      .single();

    if (error || !data) {
      log.info("시스템 사용자 정보를 찾을 수 없습니다", { teamId });

      return null;
    }

    const creds = data.credentials as any;

    return {
      systemUserId: creds.system_user_id,
      accessToken: creds.access_token,
      businessId: creds.business_id,
    };
  }

  /**
   * 특정 광고 계정의 캠페인 목록 조회
   * 시스템 사용자 토큰으로 개별 인증 없이 접근
   */
  async getAdAccountCampaigns(systemUserToken: string, adAccountId: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/${adAccountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget&access_token=${systemUserToken}`,
      );

      if (!response.ok) {
        throw new Error(`캠페인 조회 실패: ${response.statusText}`);
      }

      const result = await response.json();

      log.info("광고 계정 캠페인 조회 성공", {
        adAccountId,
        campaignCount: result.data?.length || 0,
      });

      return result.data || [];
    } catch (error) {
      log.error("광고 계정 캠페인 조회 실패", { error });
      throw error;
    }
  }
}
