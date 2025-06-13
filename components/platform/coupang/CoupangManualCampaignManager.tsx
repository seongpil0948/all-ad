"use client";

import React, { useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input, Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { FaPlus } from "react-icons/fa";

import { ErrorState } from "@/components/common/ErrorState";
import log from "@/utils/logger";

export function CoupangManualCampaignManager({ teamId }: { teamId: string }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isMetricsModalOpen, setIsMetricsModalOpen] = useState(false);
  const [selectedCampaign] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    externalId: "",
    name: "",
    status: "active",
    budget: "",
    notes: "",
  });

  const [metricsData, setMetricsData] = useState({
    date: new Date().toISOString().split("T")[0],
    impressions: "",
    clicks: "",
    spent: "",
    conversions: "",
    revenue: "",
  });

  const handleCreateCampaign = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/campaigns/coupang/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId,
          ...formData,
          budget: formData.budget ? parseFloat(formData.budget) : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create campaign");
      }

      log.info("Successfully created Coupang manual campaign", formData);
      onClose();
      setFormData({
        externalId: "",
        name: "",
        status: "active",
        budget: "",
        notes: "",
      });

      // Refresh campaigns list
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      log.error("Failed to create Coupang campaign", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMetrics = async () => {
    if (!selectedCampaign) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/campaigns/coupang/manual/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId,
          campaignId: selectedCampaign.id,
          date: metricsData.date,
          metrics: {
            impressions: metricsData.impressions
              ? parseInt(metricsData.impressions)
              : undefined,
            clicks: metricsData.clicks
              ? parseInt(metricsData.clicks)
              : undefined,
            spent: metricsData.spent
              ? parseFloat(metricsData.spent)
              : undefined,
            conversions: metricsData.conversions
              ? parseInt(metricsData.conversions)
              : undefined,
            revenue: metricsData.revenue
              ? parseFloat(metricsData.revenue)
              : undefined,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update metrics");
      }

      log.info("Successfully updated Coupang campaign metrics", metricsData);
      setIsMetricsModalOpen(false);
      setMetricsData({
        date: new Date().toISOString().split("T")[0],
        impressions: "",
        clicks: "",
        spent: "",
        conversions: "",
        revenue: "",
      });

      // Refresh campaigns list
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      log.error("Failed to update metrics", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">쿠팡 광고 수동 관리</h3>
            <p className="text-sm text-default-500">
              쿠팡은 공개 API를 제공하지 않으므로 수동으로 캠페인 데이터를
              입력하세요.
            </p>
          </div>
          <Button color="primary" startContent={<FaPlus />} onPress={onOpen}>
            캠페인 추가
          </Button>
        </CardHeader>
        <CardBody>
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-warning-800">
              <strong>참고:</strong> 쿠팡 애즈 센터에서 캠페인 ID와 성과
              데이터를 확인한 후 입력해주세요. 정확한 데이터 추적을 위해 매일
              업데이트하는 것을 권장합니다.
            </p>
          </div>

          <div className="text-center py-8">
            <p className="text-default-500 mb-4">
              쿠팡 광고 캠페인을 추가하려면 위의 &quot;캠페인 추가&quot; 버튼을
              클릭하세요.
            </p>
            <Button
              as="a"
              href="https://advertising.coupang.com"
              rel="noopener noreferrer"
              target="_blank"
              variant="bordered"
            >
              쿠팡 애즈 센터 바로가기
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Create Campaign Modal */}
      <Modal isOpen={isOpen} size="2xl" onClose={onClose}>
        <ModalContent>
          <ModalHeader>쿠팡 캠페인 추가</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                isRequired
                label="캠페인 ID"
                placeholder="쿠팡 애즈 센터의 캠페인 ID"
                value={formData.externalId}
                onChange={(e) =>
                  setFormData({ ...formData, externalId: e.target.value })
                }
              />
              <Input
                isRequired
                label="캠페인명"
                placeholder="캠페인 이름을 입력하세요"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
              <Select
                label="상태"
                selectedKeys={[formData.status]}
                onSelectionChange={(keys) =>
                  setFormData({
                    ...formData,
                    status: Array.from(keys)[0] as string,
                  })
                }
              >
                <SelectItem key="active">활성</SelectItem>
                <SelectItem key="paused">일시중지</SelectItem>
                <SelectItem key="ended">종료</SelectItem>
              </Select>
              <Input
                label="예산"
                placeholder="일일 예산 (원)"
                startContent={<span className="text-default-400">₩</span>}
                type="number"
                value={formData.budget}
                onChange={(e) =>
                  setFormData({ ...formData, budget: e.target.value })
                }
              />
              <Textarea
                label="메모"
                placeholder="캠페인 관련 메모를 입력하세요"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </div>
            {error && <ErrorState message={error} />}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              취소
            </Button>
            <Button
              color="primary"
              isDisabled={!formData.externalId || !formData.name}
              isLoading={loading}
              onPress={handleCreateCampaign}
            >
              추가
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Update Metrics Modal */}
      <Modal
        isOpen={isMetricsModalOpen}
        size="2xl"
        onClose={() => setIsMetricsModalOpen(false)}
      >
        <ModalContent>
          <ModalHeader>성과 데이터 업데이트</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                isRequired
                label="날짜"
                type="date"
                value={metricsData.date}
                onChange={(e) =>
                  setMetricsData({ ...metricsData, date: e.target.value })
                }
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="노출수"
                  type="number"
                  value={metricsData.impressions}
                  onChange={(e) =>
                    setMetricsData({
                      ...metricsData,
                      impressions: e.target.value,
                    })
                  }
                />
                <Input
                  label="클릭수"
                  type="number"
                  value={metricsData.clicks}
                  onChange={(e) =>
                    setMetricsData({ ...metricsData, clicks: e.target.value })
                  }
                />
                <Input
                  label="지출액"
                  startContent={<span className="text-default-400">₩</span>}
                  type="number"
                  value={metricsData.spent}
                  onChange={(e) =>
                    setMetricsData({ ...metricsData, spent: e.target.value })
                  }
                />
                <Input
                  label="전환수"
                  type="number"
                  value={metricsData.conversions}
                  onChange={(e) =>
                    setMetricsData({
                      ...metricsData,
                      conversions: e.target.value,
                    })
                  }
                />
              </div>
              <Input
                label="매출액"
                startContent={<span className="text-default-400">₩</span>}
                type="number"
                value={metricsData.revenue}
                onChange={(e) =>
                  setMetricsData({ ...metricsData, revenue: e.target.value })
                }
              />
            </div>
            {error && <ErrorState message={error} />}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => setIsMetricsModalOpen(false)}
            >
              취소
            </Button>
            <Button
              color="primary"
              isLoading={loading}
              onPress={handleUpdateMetrics}
            >
              업데이트
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
