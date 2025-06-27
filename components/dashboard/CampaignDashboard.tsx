"use client";

import {
  useEffect,
  useState,
  useCallback,
  useTransition,
  useMemo,
} from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { Tabs, Tab } from "@heroui/tabs";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { addToast } from "@heroui/toast";
import {
  FaFilter,
  FaDollarSign,
  FaPowerOff,
  FaCheck,
  FaChartBar,
} from "react-icons/fa";

import {
  useCampaignMutation,
  useCampaignBudgetMutation,
} from "@/hooks/useCampaigns";
import { useCampaignSWR, useCampaignPagination } from "@/hooks/useCampaignSWR";
import { Campaign } from "@/types/campaign.types";
import { PlatformType } from "@/types";
import log from "@/utils/logger";
import {
  StatCard,
  PlatformBadge,
  TableActions,
  VirtualScrollTable,
  InfiniteScrollTableColumn,
} from "@/components/common";
import {
  TableSkeleton,
  MetricCardSkeleton,
} from "@/components/common/skeletons";
import { getPlatformConfig } from "@/utils/platform-config";

const ITEMS_PER_PAGE = 20;

export function CampaignDashboard() {
  const [isPending, startTransition] = useTransition();
  const [selectedPlatform, setSelectedPlatform] = useState<
    PlatformType | "all"
  >("all");

  // SWR hooks for data fetching and mutations
  const { campaigns, filteredCampaigns, stats, isLoading, error } =
    useCampaignSWR(selectedPlatform);
  const { updateStatus, isUpdatingStatus } = useCampaignMutation();
  const { updateBudget, isUpdatingBudget } = useCampaignBudgetMutation();

  // 페이지네이션 훅
  const {
    displayedCampaigns,
    hasMore,
    loadMore,
    reset,
    currentPage,
    totalPages,
  } = useCampaignPagination(filteredCampaigns, ITEMS_PER_PAGE);

  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null,
  );
  const [newBudget, setNewBudget] = useState("");

  // Table columns definition
  const columns: InfiniteScrollTableColumn<Campaign>[] = [
    { key: "platform", label: "플랫폼" },
    { key: "name", label: "캠페인명" },
    { key: "status", label: "상태" },
    { key: "budget", label: "예산" },
    { key: "active", label: "활성화" },
    { key: "actions", label: "액션" },
  ];

  // 플랫폼 변경 시 페이지네이션 리셋
  useEffect(() => {
    reset();
  }, [selectedPlatform]); // reset을 의존성에서 제거하여 무한 루프 방지

  // Optimized callbacks with useCallback
  const handlePlatformFilter = useCallback((platform: PlatformType | "all") => {
    startTransition(() => {
      setSelectedPlatform(platform);
    });
  }, []);

  const handleBudgetEdit = useCallback(
    (campaign: Campaign) => {
      setSelectedCampaign(campaign);
      setNewBudget(campaign.budget?.toString() || "");
      onOpen();
    },
    [onOpen],
  );

  const handleBudgetUpdate = useCallback(async () => {
    if (!selectedCampaign || !newBudget) return;

    try {
      await updateBudget({
        campaignId: selectedCampaign.id,
        budget: parseFloat(newBudget),
      });

      addToast({
        title: "예산 업데이트",
        description: `캠페인 "${selectedCampaign.name}"의 예산이 ₩${newBudget}로 업데이트되었습니다.`,
        color: "success",
      });
      onClose();
    } catch (error) {
      log.error(
        `예산 업데이트 중 오류가 발생했습니다: ${JSON.stringify(error)}`,
      );
      addToast({
        title: "오류",
        description: "예산 업데이트 중 오류가 발생했습니다.",
        color: "danger",
      });
    }
  }, [selectedCampaign, newBudget, updateBudget, onClose]);

  const handleStatusToggle = useCallback(
    async (campaign: Campaign) => {
      try {
        await updateStatus({
          campaignId: campaign.id,
          status: campaign.isActive ? "PAUSED" : "ENABLED",
        });

        addToast({
          title: "성공",
          description: `캠페인이 ${campaign.isActive ? "비활성화" : "활성화"}되었습니다`,
          color: "success",
        });
      } catch (error) {
        log.error(`상태 변경 중 오류가 발생했습니다: ${JSON.stringify(error)}`);
        addToast({
          title: "오류",
          description: "상태 변경 중 오류가 발생했습니다.",
          color: "danger",
        });
      }
    },
    [updateStatus],
  );

  const handleViewMetrics = useCallback((campaignId: string) => {
    // TODO: Implement metrics view when metrics API is available
    log.info("View metrics for campaign:", { campaignId });
  }, []);

  // Render cell content - memoized for performance
  const renderCell = useCallback(
    (campaign: Campaign, columnKey: string) => {
      switch (columnKey) {
        case "platform":
          return <PlatformBadge platform={campaign.platform} />;
        case "name":
          return (
            <div>
              <p className="font-medium">{campaign.name}</p>
              <p className="text-xs text-default-500">
                ID: {campaign.platformCampaignId}
              </p>
            </div>
          );
        case "status":
          return (
            <Chip
              color={campaign.status === "active" ? "success" : "default"}
              size="sm"
              variant="flat"
            >
              {campaign.status}
            </Chip>
          );
        case "budget":
          return (
            <div className="flex items-center gap-1">
              <span>₩{campaign.budget?.toLocaleString() || "0"}</span>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => handleBudgetEdit(campaign)}
              >
                <FaDollarSign className="w-3 h-3" />
              </Button>
            </div>
          );
        case "active":
          return (
            <Button
              color={campaign.isActive ? "success" : "default"}
              isLoading={isUpdatingStatus}
              size="sm"
              startContent={campaign.isActive ? <FaCheck /> : <FaPowerOff />}
              variant="flat"
              onPress={() => handleStatusToggle(campaign)}
            >
              {campaign.isActive ? "활성" : "비활성"}
            </Button>
          );
        case "actions":
          return (
            <TableActions
              actions={[
                {
                  icon: <FaChartBar />,
                  label: "통계",
                  variant: "flat",
                  onPress: () => handleViewMetrics(campaign.id),
                },
              ]}
            />
          );
        default:
          return null;
      }
    },
    [handleBudgetEdit, handleStatusToggle, handleViewMetrics, isUpdatingStatus],
  );

  // 플랫폼별 캠페인 수 계산
  const campaignCounts = useMemo(() => {
    return campaigns.reduce(
      (acc, campaign) => {
        acc[campaign.platform] = (acc[campaign.platform] || 0) + 1;

        return acc;
      },
      {} as Record<PlatformType, number>,
    );
  }, [campaigns]);

  // 전체 통계 계산 (use SWR stats or fallback to calculated stats)
  const totalStats = stats || {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter((c) => c.isActive).length,
    totalSpend: 0,
    totalClicks: 0,
    totalImpressions: 0,
    averageCTR: 0,
    averageCPC: 0,
  };

  // 에러 상태 처리
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">캠페인 대시보드</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-danger">
            데이터를 불러오는 중 오류가 발생했습니다.
          </p>
          <Button className="mt-4" onPress={() => window.location.reload()}>
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">캠페인 대시보드</h2>
        <Button size="sm" startContent={<FaFilter />} variant="flat">
          필터
        </Button>
      </div>

      {/* 전체 통계 */}
      {isLoading && campaigns.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="전체 캠페인" value={totalStats.totalCampaigns} />
          <StatCard
            label="활성 캠페인"
            value={totalStats.activeCampaigns}
            valueClassName="text-2xl font-bold text-success"
          />
          <StatCard
            label="총 비용"
            value={`₩${totalStats.totalSpend.toLocaleString()}`}
          />
        </div>
      )}

      {/* 플랫폼 탭 */}
      <Tabs
        selectedKey={selectedPlatform}
        onSelectionChange={(key) =>
          handlePlatformFilter(key as PlatformType | "all")
        }
      >
        <Tab key="all" title={`전체 (${campaigns.length})`} />
        {Object.entries(campaignCounts).map(([platform, count]) => {
          const config = getPlatformConfig(platform as PlatformType);

          return (
            <Tab
              key={platform}
              title={
                <div className="flex items-center gap-2">
                  <config.icon />
                  <span>
                    {config.name} ({count})
                  </span>
                </div>
              }
            />
          );
        })}
      </Tabs>

      {/* 캠페인 테이블 */}
      {isLoading && campaigns.length === 0 ? (
        <TableSkeleton columns={6} rows={5} />
      ) : (
        <>
          <div className="text-xs text-default-500 mb-2">
            총 {campaigns.length}개 캠페인 중 {filteredCampaigns.length}개
            필터됨, 로드된 항목: {displayedCampaigns.length} (페이지{" "}
            {currentPage}/{totalPages})
          </div>
          <VirtualScrollTable
            aria-label="캠페인 목록"
            columns={columns}
            emptyContent="캠페인이 없습니다"
            estimateSize={60}
            hasMore={hasMore}
            isLoading={isLoading || isPending}
            items={displayedCampaigns}
            maxHeight="600px"
            overscan={5}
            renderCell={renderCell}
            onLoadMore={loadMore}
          />
        </>
      )}

      {/* 예산 수정 모달 */}
      <Modal
        isDismissable={false}
        isKeyboardDismissDisabled={true}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                예산 수정
              </ModalHeader>
              <ModalBody>
                {selectedCampaign && (
                  <div className="space-y-4">
                    <p className="text-sm text-default-600">
                      캠페인: {selectedCampaign.name}
                    </p>
                    <Input
                      label="새 예산"
                      placeholder="예산을 입력하세요"
                      startContent={<span className="text-default-400">₩</span>}
                      type="number"
                      value={newBudget}
                      onChange={(e) => setNewBudget(e.target.value)}
                    />
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  취소
                </Button>
                <Button
                  color="primary"
                  isLoading={isUpdatingBudget}
                  onPress={handleBudgetUpdate}
                >
                  저장
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
