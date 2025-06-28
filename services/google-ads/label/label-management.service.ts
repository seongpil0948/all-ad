import type { MutateOperation } from "google-ads-api";

import { GoogleAdsClient } from "../core/google-ads-client";

import log from "@/utils/logger";
import { GoogleAdsLabel } from "@/types/google-ads.types";

// Type definitions
interface GoogleAdsMutateResponse {
  results: Array<{
    resource_name: string;
  }>;
  partial_failure_error?: unknown;
}

interface GoogleAdsCampaignWithLabel {
  "campaign.id": string;
  "campaign.name": string;
  "campaign.status": string;
  "label.id": string;
  "label.name": string;
}

interface GoogleAdsLabelResult {
  "label.id": string;
  "label.name": string;
  "label.text_label.description": string;
  "label.text_label.background_color": string;
}

interface GoogleAdsLabelResource {
  resource_name: string;
  name?: string;
  text_label?: {
    description?: string;
    background_color?: string;
  };
}

export class LabelManagementService {
  constructor(private googleAdsClient: GoogleAdsClient) {}

  // 라벨 생성
  async createLabel(
    customerId: string,
    labelData: {
      name: string;
      description?: string;
      backgroundColor?: string;
    },
  ): Promise<GoogleAdsMutateResponse> {
    const operations = [
      {
        entity: "label",
        operation: "create",
        resource: {
          name: labelData.name,
          description: labelData.description,
          text_label: {
            background_color: labelData.backgroundColor || "#0000FF",
          },
        },
      } as MutateOperation<Record<string, unknown>>,
    ];

    try {
      const response = await this.googleAdsClient.mutate(
        customerId,
        operations,
      );

      log.info("라벨 생성 성공", { customerId, labelName: labelData.name });

      return response;
    } catch (error) {
      log.error("라벨 생성 실패", error as Error, {
        customerId,
        labelData,
      });
      throw error;
    }
  }

  // 캠페인에 라벨 할당
  async assignLabelToCampaigns(
    customerId: string,
    labelId: string,
    campaignIds: string[],
  ): Promise<GoogleAdsMutateResponse> {
    const operations = campaignIds.map(
      (campaignId) =>
        ({
          entity: "campaign_label",
          operation: "create",
          resource: {
            campaign: `customers/${customerId}/campaigns/${campaignId}`,
            label: `customers/${customerId}/labels/${labelId}`,
          },
        }) as MutateOperation<Record<string, unknown>>,
    );

    try {
      const response = await this.googleAdsClient.mutate(
        customerId,
        operations,
      );

      log.info("캠페인에 라벨 할당 성공", {
        customerId,
        labelId,
        campaignCount: campaignIds.length,
      });

      return response;
    } catch (error) {
      log.error("캠페인에 라벨 할당 실패", error as Error, {
        customerId,
        labelId,
        campaignIds,
      });
      throw error;
    }
  }

  // 라벨로 캠페인 조회
  async getCampaignsByLabel(
    customerId: string,
    labelId: string,
  ): Promise<GoogleAdsCampaignWithLabel[]> {
    const query = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        label.id,
        label.name
      FROM campaign_label
      WHERE label.id = ${labelId}
    `;

    try {
      const results =
        await this.googleAdsClient.query<GoogleAdsCampaignWithLabel>(
          customerId,
          query,
        );

      log.info("라벨로 캠페인 조회 성공", {
        customerId,
        labelId,
        count: results.length,
      });

      return results;
    } catch (error) {
      log.error("라벨로 캠페인 조회 실패", error as Error, {
        customerId,
        labelId,
      });
      throw error;
    }
  }

  // 라벨 목록 조회
  async getLabels(customerId: string): Promise<GoogleAdsLabel[]> {
    const query = `
      SELECT
        label.id,
        label.name,
        label.status,
        label.text_label.description,
        label.text_label.background_color
      FROM label
      WHERE label.status = 'ENABLED'
      ORDER BY label.name
    `;

    try {
      const results = await this.googleAdsClient.query<GoogleAdsLabelResult>(
        customerId,
        query,
      );

      return results.map((result) => ({
        id: result["label.id"],
        name: result["label.name"],
        description: result["label.text_label.description"],
        backgroundColor: result["label.text_label.background_color"],
      }));
    } catch (error) {
      log.error("라벨 목록 조회 실패", error as Error, { customerId });
      throw error;
    }
  }

  // 캠페인에서 라벨 제거
  async removeLabelFromCampaigns(
    customerId: string,
    labelId: string,
    campaignIds: string[],
  ): Promise<GoogleAdsMutateResponse> {
    const operations = campaignIds.map(
      (campaignId) =>
        ({
          entity: "campaign_label",
          operation: "remove",
          resource_name: `customers/${customerId}/campaignLabels/${campaignId}~${labelId}`,
        }) as unknown as MutateOperation<Record<string, unknown>>,
    );

    try {
      const response = await this.googleAdsClient.mutate(
        customerId,
        operations,
      );

      log.info("캠페인에서 라벨 제거 성공", {
        customerId,
        labelId,
        campaignCount: campaignIds.length,
      });

      return response;
    } catch (error) {
      log.error("캠페인에서 라벨 제거 실패", error as Error, {
        customerId,
        labelId,
        campaignIds,
      });
      throw error;
    }
  }

  // 라벨 업데이트
  async updateLabel(
    customerId: string,
    labelId: string,
    updates: {
      name?: string;
      description?: string;
      backgroundColor?: string;
    },
  ): Promise<GoogleAdsMutateResponse> {
    const resource: GoogleAdsLabelResource = {
      resource_name: `customers/${customerId}/labels/${labelId}`,
    };

    const updatePaths: string[] = [];

    if (updates.name) {
      resource.name = updates.name;
      updatePaths.push("name");
    }

    if (updates.description !== undefined) {
      resource.text_label = resource.text_label || {};
      resource.text_label.description = updates.description;
      updatePaths.push("text_label.description");
    }

    if (updates.backgroundColor) {
      resource.text_label = resource.text_label || {};
      resource.text_label.background_color = updates.backgroundColor;
      updatePaths.push("text_label.background_color");
    }

    const operations = [
      {
        entity: "label",
        operation: "update",
        resource,
        update_mask: {
          paths: updatePaths,
        },
      } as unknown as MutateOperation<Record<string, unknown>>,
    ];

    try {
      const response = await this.googleAdsClient.mutate(
        customerId,
        operations,
      );

      log.info("라벨 업데이트 성공", { customerId, labelId, updates });

      return response;
    } catch (error) {
      log.error("라벨 업데이트 실패", error as Error, {
        customerId,
        labelId,
        updates,
      });
      throw error;
    }
  }

  // 라벨 삭제
  async deleteLabel(
    customerId: string,
    labelId: string,
  ): Promise<GoogleAdsMutateResponse> {
    const operations = [
      {
        entity: "label",
        operation: "remove",
        resource_name: `customers/${customerId}/labels/${labelId}`,
      } as unknown as MutateOperation<Record<string, unknown>>,
    ];

    try {
      const response = await this.googleAdsClient.mutate(
        customerId,
        operations,
      );

      log.info("라벨 삭제 성공", { customerId, labelId });

      return response;
    } catch (error) {
      log.error("라벨 삭제 실패", error as Error, { customerId, labelId });
      throw error;
    }
  }
}
