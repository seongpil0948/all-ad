import { GoogleAdsClient } from "./core/google-ads-client";
import { CampaignControlService } from "./campaign/campaign-control.service";
import { LabelManagementService } from "./label/label-management.service";
import { GoogleAdsSyncService } from "./sync/sync-strategy.service";

import { GoogleAdsApiCredentials } from "@/types/google-ads.types";
import { Logger } from "@/utils/logger";

// Google Ads 통합 서비스
export class GoogleAdsIntegrationService {
  private googleAdsClient: GoogleAdsClient;
  private campaignControl: CampaignControlService;
  private labelManagement: LabelManagementService;
  private syncService: GoogleAdsSyncService;

  constructor(credentials: GoogleAdsApiCredentials) {
    // 서비스 초기화
    this.googleAdsClient = new GoogleAdsClient(credentials);
    this.campaignControl = new CampaignControlService(this.googleAdsClient);
    this.labelManagement = new LabelManagementService(this.googleAdsClient);
    this.syncService = new GoogleAdsSyncService(this.googleAdsClient);
  }

  // === 캠페인 제어 메서드 ===

  // 캠페인 상태 토글 (ON/OFF)
  async toggleCampaignStatus(
    accountId: string,
    campaignId: string,
    enable: boolean,
  ): Promise<any> {
    try {
      Logger.info("캠페인 상태 변경 시작", { accountId, campaignId, enable });

      return await this.campaignControl.toggleCampaignStatus(
        accountId,
        campaignId,
        enable,
      );
    } catch (error) {
      Logger.error("캠페인 상태 변경 실패", error as Error, {
        accountId,
        campaignId,
        enable,
      });
      throw error;
    }
  }

  // 라벨 기반 캠페인 일괄 제어
  async toggleCampaignsByLabel(
    accountId: string,
    labelId: string,
    enable: boolean,
  ): Promise<any> {
    try {
      Logger.info("라벨 기반 캠페인 일괄 제어 시작", {
        accountId,
        labelId,
        enable,
      });

      // 라벨에 연결된 캠페인 조회
      const campaigns = await this.labelManagement.getCampaignsByLabel(
        accountId,
        labelId,
      );

      const campaignIds = campaigns.map((c) => c["campaign.id"]);

      if (enable) {
        return await this.campaignControl.enableCampaigns(
          accountId,
          campaignIds,
        );
      } else {
        return await this.campaignControl.pauseCampaigns(
          accountId,
          campaignIds,
        );
      }
    } catch (error) {
      Logger.error("라벨 기반 캠페인 일괄 제어 실패", error as Error, {
        accountId,
        labelId,
        enable,
      });
      throw error;
    }
  }

  // 캠페인 목록 조회
  async getCampaigns(accountId: string, includeRemoved = false) {
    return await this.campaignControl.getCampaigns(accountId, includeRemoved);
  }

  // 캠페인 메트릭 조회
  async getCampaignMetrics(
    accountId: string,
    campaignId: string,
    startDate: string,
    endDate: string,
  ) {
    return await this.campaignControl.getCampaignMetrics(
      accountId,
      campaignId,
      startDate,
      endDate,
    );
  }

  // 캠페인 예산 업데이트
  async updateCampaignBudget(
    accountId: string,
    campaignId: string,
    budgetAmountMicros: number,
  ) {
    return await this.campaignControl.updateCampaignBudget(
      accountId,
      campaignId,
      budgetAmountMicros,
    );
  }

  // === 라벨 관리 메서드 ===

  // 라벨 생성
  async createLabel(
    accountId: string,
    labelData: {
      name: string;
      description?: string;
      backgroundColor?: string;
    },
  ) {
    return await this.labelManagement.createLabel(accountId, labelData);
  }

  // 라벨 목록 조회
  async getLabels(accountId: string) {
    return await this.labelManagement.getLabels(accountId);
  }

  // 캠페인에 라벨 할당
  async assignLabelToCampaigns(
    accountId: string,
    labelId: string,
    campaignIds: string[],
  ) {
    return await this.labelManagement.assignLabelToCampaigns(
      accountId,
      labelId,
      campaignIds,
    );
  }

  // 라벨 업데이트
  async updateLabel(
    accountId: string,
    labelId: string,
    updates: {
      name?: string;
      description?: string;
      backgroundColor?: string;
    },
  ) {
    return await this.labelManagement.updateLabel(accountId, labelId, updates);
  }

  // 라벨 삭제
  async deleteLabel(accountId: string, labelId: string) {
    return await this.labelManagement.deleteLabel(accountId, labelId);
  }

  // === 동기화 메서드 ===

  // 수동 동기화 트리거
  async triggerSync(accountId: string, syncType: "FULL" | "INCREMENTAL") {
    return await this.syncService.scheduleSyncForAccount(accountId, syncType);
  }

  // 동기화 상태 조회
  async getSyncStatus(accountId: string) {
    return await this.syncService.getSyncStatus(accountId);
  }

  // 동기화 이력 조회
  async getSyncHistory(accountId: string, limit?: number) {
    return await this.syncService.getSyncHistory(accountId, limit);
  }

  // === 계정 관리 메서드 ===

  // 계정 정보 조회
  async getAccountInfo(accountId: string) {
    return await this.googleAdsClient.getAccountInfo(accountId);
  }

  // 접근 가능한 계정 목록 조회 (MCC)
  async getAccessibleCustomers() {
    return await this.googleAdsClient.getAccessibleCustomers();
  }

  // === 리포트 메서드 ===

  // 커스텀 리포트 실행
  async runReport(accountId: string, query: string) {
    return await this.googleAdsClient.report(accountId, query);
  }

  // 성과 요약 리포트
  async getPerformanceSummary(
    accountId: string,
    startDate: string,
    endDate: string,
  ) {
    const query = `
      SELECT
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.ctr,
        metrics.average_cpc,
        metrics.average_cpm,
        metrics.cost_per_conversion
      FROM customer
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
    `;

    const results = await this.googleAdsClient.query(accountId, query);

    return results[0] || null;
  }

  // === 유틸리티 메서드 ===

  // 연결 테스트
  async testConnection(accountId: string): Promise<boolean> {
    try {
      await this.getAccountInfo(accountId);

      return true;
    } catch (error) {
      Logger.error("Google Ads 연결 테스트 실패", error as Error, {
        accountId,
      });

      return false;
    }
  }

  // 클린업 (리소스 정리)
  async cleanup(): Promise<void> {
    // 필요한 경우 리소스 정리 로직 추가
    Logger.info("Google Ads 통합 서비스 정리 완료");
  }
}
