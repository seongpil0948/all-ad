"use client";

import { useCallback, useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Spinner } from "@heroui/spinner";
import { Divider } from "@heroui/divider";

import { Campaign, CampaignMetrics } from "@/types/campaign.types";
import { PlatformBadge } from "@/components/common/PlatformBadge";
import log from "@/utils/logger";
import { useDictionary } from "@/hooks/use-dictionary";

interface CampaignMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign | null;
}

export function CampaignMetricsModal({
  isOpen,
  onClose,
  campaign,
}: CampaignMetricsModalProps) {
  const { dictionary } = useDictionary();
  const [metrics, setMetrics] = useState<CampaignMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!campaign) return;

    setIsLoading(true);
    setError(null);

    try {
      // Use server action to fetch metrics data
      const response = await fetch(
        `/api/campaigns/${campaign.platform}/${campaign.platform_campaign_id}/metrics`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.statusText}`);
      }

      const metricsData = await response.json();

      setMetrics(metricsData);
      log.info("Campaign metrics loaded", {
        campaignId: campaign.id,
        metricsCount: metricsData.length,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch metrics";

      setError(errorMessage);
      log.error("Failed to fetch campaign metrics", error);
    } finally {
      setIsLoading(false);
    }
  }, [campaign]);

  // Fetch metrics when modal opens
  useEffect(() => {
    if (isOpen && campaign) {
      fetchMetrics();
    }
  }, [isOpen, campaign, fetchMetrics]);

  // Calculate aggregated metrics
  const aggregatedMetrics = metrics.reduce(
    (acc, metric) => ({
      impressions: acc.impressions + (metric.impressions || 0),
      clicks: acc.clicks + (metric.clicks || 0),
      cost: acc.cost + (metric.cost || 0),
      conversions: acc.conversions + (metric.conversions || 0),
      revenue: acc.revenue + (metric.revenue || 0),
    }),
    { impressions: 0, clicks: 0, cost: 0, conversions: 0, revenue: 0 },
  );

  // Calculate derived metrics
  const ctr =
    aggregatedMetrics.impressions > 0
      ? (aggregatedMetrics.clicks / aggregatedMetrics.impressions) * 100
      : 0;
  const cpc =
    aggregatedMetrics.clicks > 0
      ? aggregatedMetrics.cost / aggregatedMetrics.clicks
      : 0;
  const roas =
    aggregatedMetrics.cost > 0
      ? aggregatedMetrics.revenue / aggregatedMetrics.cost
      : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("ko-KR").format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(2)}%`;
  };

  return (
    <Modal
      backdrop={"opaque"}
      isOpen={isOpen}
      scrollBehavior={"inside"}
      size="2xl"
      onClose={onClose}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {campaign && <PlatformBadge platform={campaign.platform} />}
            <span>{dictionary.campaignMetricsModal.title}</span>
          </div>
          {campaign && (
            <p className="text-sm text-default-500 font-normal">
              {campaign.name}
            </p>
          )}
        </ModalHeader>
        <ModalBody>
          {isLoading && (
            <div className="flex justify-center items-center py-8">
              <Spinner size="lg" />
            </div>
          )}

          {error && (
            <Card className="bg-danger-50 border-danger-200">
              <CardBody>
                <p className="text-danger-700">{error}</p>
              </CardBody>
            </Card>
          )}

          {!isLoading && !error && metrics.length === 0 && (
            <Card className="bg-warning-50 border-warning-200">
              <CardBody>
                <p className="text-warning-700">
                  {dictionary.campaignMetricsModal.noData}
                </p>
              </CardBody>
            </Card>
          )}

          {!isLoading && !error && metrics.length > 0 && (
            <div className="space-y-4">
              {/* Aggregated Metrics Summary */}
              <Card>
                <CardBody>
                  <h3 className="text-lg font-semibold mb-4">
                    {dictionary.campaignMetricsModal.summaryTitle}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-default-500">
                        {dictionary.campaignMetricsModal.impressions}
                      </p>
                      <p className="text-xl font-bold">
                        {formatNumber(aggregatedMetrics.impressions)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-default-500">
                        {dictionary.campaignMetricsModal.clicks}
                      </p>
                      <p className="text-xl font-bold">
                        {formatNumber(aggregatedMetrics.clicks)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-default-500">
                        {dictionary.campaignMetricsModal.cost}
                      </p>
                      <p className="text-xl font-bold">
                        {formatCurrency(aggregatedMetrics.cost)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-default-500">
                        {dictionary.campaignMetricsModal.conversions}
                      </p>
                      <p className="text-xl font-bold">
                        {formatNumber(aggregatedMetrics.conversions)}
                      </p>
                    </div>
                  </div>

                  <Divider className="my-4" />

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-default-500">
                        {dictionary.campaignMetricsModal.ctr}
                      </p>
                      <p className="text-lg font-semibold">
                        {formatPercentage(ctr)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-default-500">
                        {dictionary.campaignMetricsModal.cpc}
                      </p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(cpc)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-default-500">
                        {dictionary.campaignMetricsModal.roas}
                      </p>
                      <p className="text-lg font-semibold">
                        {roas.toFixed(2)}
                        {dictionary.analytics.ui?.multiplierSuffix ?? "x"}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Recent Daily Metrics */}
              <Card>
                <CardBody>
                  <h3 className="text-lg font-semibold mb-4">
                    {dictionary.campaignMetricsModal.dailyPerformanceTitle}
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {metrics
                      .slice(-10)
                      .reverse()
                      .map((metric, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-2 bg-default-50 rounded"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium">{metric.date}</p>
                          </div>
                          <div className="flex gap-4 text-sm">
                            <span>
                              {formatNumber(metric.impressions || 0)}{" "}
                              {dictionary.campaignMetricsModal.impressionsUnit}
                            </span>
                            <span>
                              {formatNumber(metric.clicks || 0)}{" "}
                              {dictionary.campaignMetricsModal.clicksUnit}
                            </span>
                            <span>{formatCurrency(metric.cost || 0)}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardBody>
              </Card>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onPress={onClose}>
            {dictionary.campaignMetricsModal.closeButton}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
