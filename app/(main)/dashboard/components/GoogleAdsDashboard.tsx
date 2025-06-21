"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Switch } from "@heroui/switch";

import {
  syncGoogleAdsCampaigns,
  updateGoogleAdsCampaignStatus,
} from "../actions";

import log from "@/utils/logger";

interface GoogleAdsCampaign {
  id: string;
  name: string;
  status: string;
  is_active: boolean;
  budget?: number;
  impressions?: number;
  clicks?: number;
  cost?: number;
  ctr?: number;
}

interface GoogleAdsDashboardProps {
  campaigns: GoogleAdsCampaign[];
  hasCredentials: boolean;
}

export default function GoogleAdsDashboard({
  campaigns: initialCampaigns,
  hasCredentials,
}: GoogleAdsDashboardProps) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [isSyncing, setIsSyncing] = useState(false);
  const [updatingCampaigns, setUpdatingCampaigns] = useState<Set<string>>(
    new Set(),
  );

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await syncGoogleAdsCampaigns();

      if (result.success) {
        // 페이지가 revalidate되므로 새로고침
        window.location.reload();
      } else {
        log.error("Sync failed", result.error);
      }
    } catch (error) {
      log.error("Sync error", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleStatusToggle = async (
    campaignId: string,
    currentStatus: boolean,
  ) => {
    setUpdatingCampaigns((prev) => new Set(prev).add(campaignId));

    try {
      const result = await updateGoogleAdsCampaignStatus(
        campaignId,
        !currentStatus,
      );

      if (result.success) {
        setCampaigns((prev) =>
          prev.map((campaign) =>
            campaign.id === campaignId
              ? {
                  ...campaign,
                  is_active: !currentStatus,
                  status: !currentStatus ? "ACTIVE" : "PAUSED",
                }
              : campaign,
          ),
        );
      } else {
        log.error("Status update failed", result.error);
      }
    } catch (error) {
      log.error("Status update error", error);
    } finally {
      setUpdatingCampaigns((prev) => {
        const newSet = new Set(prev);

        newSet.delete(campaignId);

        return newSet;
      });
    }
  };

  if (!hasCredentials) {
    return (
      <Card>
        <CardBody className="text-center py-8">
          <p className="text-gray-600 mb-4">Google Ads 계정을 연동해주세요</p>
          <Button color="primary" href="/integrated">
            계정 연동하기
          </Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Google Ads 캠페인</h2>
          <Button
            color="primary"
            isLoading={isSyncing}
            size="sm"
            onPress={handleSync}
          >
            {isSyncing ? "동기화 중..." : "동기화"}
          </Button>
        </CardHeader>
        <CardBody>
          {campaigns.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">캠페인이 없습니다</p>
              <Button color="primary" variant="light" onPress={handleSync}>
                캠페인 동기화하기
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-lg">{campaign.name}</h3>
                      <p className="text-sm text-gray-600">ID: {campaign.id}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Chip
                        color={campaign.is_active ? "success" : "default"}
                        size="sm"
                        variant="flat"
                      >
                        {campaign.status}
                      </Chip>
                      <Switch
                        isDisabled={updatingCampaigns.has(campaign.id)}
                        isSelected={campaign.is_active}
                        onValueChange={() =>
                          handleStatusToggle(campaign.id, campaign.is_active)
                        }
                      >
                        {updatingCampaigns.has(campaign.id) ? (
                          <Spinner size="sm" />
                        ) : null}
                      </Switch>
                    </div>
                  </div>

                  {/* 캠페인 메트릭 */}
                  {(campaign.impressions ||
                    campaign.clicks ||
                    campaign.cost) && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t">
                      <div>
                        <p className="text-sm text-gray-600">노출수</p>
                        <p className="font-semibold">
                          {(campaign.impressions || 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">클릭수</p>
                        <p className="font-semibold">
                          {(campaign.clicks || 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">비용</p>
                        <p className="font-semibold">
                          ${(campaign.cost || 0).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">CTR</p>
                        <p className="font-semibold">
                          {(campaign.ctr || 0).toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  )}

                  {campaign.budget && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-gray-600">일일 예산</p>
                      <p className="font-semibold">
                        ${campaign.budget.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
