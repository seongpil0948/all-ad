"use client";

import {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useTransition,
} from "react";
import { Card, CardBody } from "@heroui/card";
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
import { useAsyncList } from "@react-stately/data";
import { useShallow } from "zustand/shallow";
import {
  FaFilter,
  FaDollarSign,
  FaPowerOff,
  FaCheck,
  FaChartBar,
} from "react-icons/fa";

import { useCampaignStore } from "@/stores";
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

  // Use useShallow to optimize re-renders
  const {
    campaigns = [],
    isLoading,
    fetchCampaigns,
    updateCampaignBudget,
    updateCampaignStatus,
    setFilters,
  } = useCampaignStore(
    useShallow((state) => ({
      campaigns: state.campaigns,
      isLoading: state.isLoading,
      fetchCampaigns: state.fetchCampaigns,
      updateCampaignBudget: state.updateCampaignBudget,
      updateCampaignStatus: state.updateCampaignStatus,
      setFilters: state.setFilters,
    })),
  );

  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null,
  );
  const [newBudget, setNewBudget] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<
    PlatformType | "all"
  >("all");
  const [hasMore, setHasMore] = useState(true);

  // Filter campaigns based on selected platform
  const filteredCampaigns = useMemo(() => {
    if (selectedPlatform === "all") {
      return campaigns;
    }

    return campaigns.filter((c) => c.platform === selectedPlatform);
  }, [campaigns, selectedPlatform]);

  // Infinite scroll setup
  const campaignList = useAsyncList<Campaign>({
    async load({ cursor }) {
      const start = cursor ? parseInt(cursor) : 0;
      const items = filteredCampaigns.slice(start, start + ITEMS_PER_PAGE);

      const hasMoreItems = start + ITEMS_PER_PAGE < filteredCampaigns.length;

      setHasMore(hasMoreItems);

      return {
        items,
        cursor: hasMoreItems ? String(start + ITEMS_PER_PAGE) : undefined,
      };
    },
    getKey: (item) => item.id,
  });

  // Table columns definition
  const columns: InfiniteScrollTableColumn<Campaign>[] = [
    { key: "platform", label: "플랫폼" },
    { key: "name", label: "캠페인명" },
    { key: "status", label: "상태" },
    { key: "budget", label: "예산" },
    { key: "active", label: "활성화" },
    { key: "actions", label: "액션" },
  ];

  // Effect 1: Reload list when filter changes - separate concern
  useEffect(() => {
    startTransition(() => {
      campaignList.reload();
    });
  }, [selectedPlatform]);

  // Effect 2: Reload list when campaigns change - separate concern
  useEffect(() => {
    startTransition(() => {
      campaignList.reload();
    });
  }, [campaigns.length]);

  // Effect 3: Initial data fetch - runs once
  useEffect(() => {
    fetchCampaigns().catch((err) => {
      log.error("Failed to fetch campaigns", err);
    });
  }, [fetchCampaigns]);

  // Optimized callbacks with useCallback
  const handlePlatformFilter = useCallback(
    (platform: PlatformType | "all") => {
      startTransition(() => {
        setSelectedPlatform(platform);
        if (platform === "all") {
          setFilters({});
        } else {
          setFilters({ platform });
        }
      });
    },
    [setFilters],
  );

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
      startTransition(() => {
        updateCampaignBudget(selectedCampaign.id, parseFloat(newBudget));
      });

      addToast({
        title: "예산 업데이트",
        description: `캠페인 "${selectedCampaign.name}"의 예산이 ₩${newBudget}로 업데이트되었습니다.`,
        color: "success",
      });
      onClose();
    } catch (error) {
      log.error(
        `예산 업데이트 중 오류가 발생했습니다 : ${JSON.stringify(error)}`,
      );
      addToast({
        title: "오류",
        description: "예산 업데이트 중 오류가 발생했습니다.",
        color: "danger",
      });
    }
  }, [selectedCampaign, newBudget, updateCampaignBudget, onClose]);

  const handleStatusToggle = useCallback(
    async (campaign: Campaign) => {
      try {
        startTransition(() => {
          updateCampaignStatus(
            campaign.id,
            campaign.isActive ? "PAUSED" : "ENABLED",
          );
        });

        addToast({
          title: "성공",
          description: `캠페인이 ${campaign.isActive ? "비활성화" : "활성화"}되었습니다`,
          color: "success",
        });
      } catch (error) {
        log.error(
          `상태 변경 중 오류가 발생했습니다 : ${JSON.stringify(error)}`,
        );
        addToast({
          title: "오류",
          description: "상태 변경 중 오류가 발생했습니다.",
          color: "danger",
        });
      }
    },
    [updateCampaignStatus],
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
              color={campaign.isActive ? "success" : "default"}
              size="sm"
              variant="flat"
            >
              {campaign.status || "Unknown"}
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
    [handleBudgetEdit, handleStatusToggle, handleViewMetrics],
  );

  // 플랫폼별 캠페인 수 계산
  const campaignCounts = campaigns.reduce(
    (acc, campaign) => {
      acc[campaign.platform] = (acc[campaign.platform] || 0) + 1;

      return acc;
    },
    {} as Record<PlatformType, number>,
  );

  // 전체 통계 계산
  const totalStats = {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter((c) => c.isActive).length,
    totalBudget: campaigns.reduce((sum, c) => sum + (c.budget || 0), 0),
  };

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
            label="총 예산"
            value={`₩${totalStats.totalBudget.toLocaleString()}`}
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
        {(
          ["facebook", "google", "kakao", "naver", "coupang"] as PlatformType[]
        ).map((platform) => {
          const config = getPlatformConfig(platform);
          const Icon = config.icon;

          return (
            <Tab
              key={platform}
              title={
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span>
                    {config.name} ({campaignCounts[platform] || 0})
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
        <VirtualScrollTable
          aria-label="캠페인 목록"
          columns={columns}
          emptyContent="캠페인이 없습니다"
          estimateSize={60}
          hasMore={hasMore}
          isLoading={campaignList.isLoading || isPending}
          items={campaignList}
          maxHeight="600px"
          overscan={5}
          renderCell={renderCell}
          onLoadMore={() => campaignList.loadMore()}
        />
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
                <Button color="primary" onPress={handleBudgetUpdate}>
                  수정
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {campaignList.items.length === 0 &&
        !campaignList.isLoading &&
        filteredCampaigns.length === 0 && (
          <Card>
            <CardBody className="text-center py-10">
              <p className="text-default-500">
                캠페인이 없습니다. 플랫폼을 연동하고 동기화를 진행하세요.
              </p>
            </CardBody>
          </Card>
        )}
    </div>
  );
}
