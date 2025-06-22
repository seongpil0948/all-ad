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
import { FaFilter, FaDollarSign, FaPowerOff, FaCheck } from "react-icons/fa";

import { useCampaignStore } from "@/stores";
import { Campaign } from "@/types/campaign.types";
import { PlatformType } from "@/types";
import log from "@/utils/logger";
import { useFilterUrlSync } from "@/hooks/useUrlSync";
import {
  StatCard,
  PlatformBadge,
  TableActions,
  InfiniteScrollTable,
  InfiniteScrollTableColumn,
} from "@/components/common";
import {
  TableSkeleton,
  MetricCardSkeleton,
} from "@/components/common/skeletons";
import { getPlatformConfig } from "@/utils/platform-config";

const ITEMS_PER_PAGE = 20;

interface CampaignDashboardClientProps {
  initialCampaigns: Campaign[];
  initialStats: {
    totalCampaigns: number;
    activeCampaigns: number;
    totalBudget: number;
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    platforms: number;
  };
}

export function CampaignDashboardClient({
  initialCampaigns,
  initialStats,
}: CampaignDashboardClientProps) {
  const [isPending, startTransition] = useTransition();

  // Use useShallow to optimize re-renders
  const {
    campaigns = initialCampaigns,
    isLoading,
    stats = initialStats,
    filters,
    // fetchCampaigns,
    updateCampaignBudget,
    updateCampaignStatus,
    setFilters,
  } = useCampaignStore(
    useShallow((state) => ({
      campaigns: state.campaigns,
      isLoading: state.isLoading,
      stats: state.stats,
      filters: state.filters,
      // fetchCampaigns: state.fetchCampaigns,
      updateCampaignBudget: state.updateCampaignBudget,
      updateCampaignStatus: state.updateCampaignStatus,
      setFilters: state.setFilters,
    })),
  );

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null,
  );
  const [budgetInput, setBudgetInput] = useState("");
  const [filterInput, setFilterInput] = useState("");
  const [hasMore, setHasMore] = useState(true);

  // Effect 1: URL synchronization - separate concern
  useFilterUrlSync(filters, setFilters);

  // Effect 2: Filter input synchronization - separate concern
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      startTransition(() => {
        setFilters({ search: filterInput });
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filterInput, setFilters]);

  // Effect 3: Modal state management - separate concern
  useEffect(() => {
    if (!isOpen) {
      setSelectedCampaign(null);
      setBudgetInput("");
    }
  }, [isOpen]);

  // Filtered campaigns calculation - memoized
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      const matchesSearch =
        !filters.search ||
        campaign.name.toLowerCase().includes(filters.search.toLowerCase());
      const matchesPlatform =
        !filters.platform || campaign.platform === filters.platform;
      const matchesStatus =
        filters.isActive === undefined ||
        campaign.isActive === filters.isActive;

      return matchesSearch && matchesPlatform && matchesStatus;
    });
  }, [campaigns, filters]);

  // Async list for infinite scrolling
  const list = useAsyncList<Campaign>({
    async load({ cursor }) {
      const start = cursor ? parseInt(cursor) : 0;
      const items = filteredCampaigns.slice(start, start + ITEMS_PER_PAGE);
      const nextCursor =
        start + ITEMS_PER_PAGE < filteredCampaigns.length
          ? String(start + ITEMS_PER_PAGE)
          : undefined;

      setHasMore(!!nextCursor);

      return {
        items,
        cursor: nextCursor,
      };
    },
    getKey: (item) => item.id,
  });

  // Reload list when filters change
  useEffect(() => {
    list.reload();
  }, [filteredCampaigns]);

  // Table columns configuration
  const columns: InfiniteScrollTableColumn<Campaign>[] = [
    { key: "name", label: "캠페인명" },
    { key: "platform", label: "플랫폼" },
    { key: "status", label: "상태" },
    { key: "budget", label: "예산" },
    { key: "metrics", label: "성과" },
    { key: "actions", label: "액션" },
  ];

  // Optimized callbacks with useCallback
  const handleBudgetEdit = useCallback(
    (campaign: Campaign) => {
      setSelectedCampaign(campaign);
      setBudgetInput(String(campaign.budget || 0));
      onOpen();
    },
    [onOpen],
  );

  const handleBudgetUpdate = useCallback(async () => {
    if (!selectedCampaign) return;

    const newBudget = parseFloat(budgetInput);

    if (isNaN(newBudget) || newBudget < 0) {
      addToast({
        title: "오류",
        description: "올바른 예산 금액을 입력해주세요",
        color: "danger",
      });

      return;
    }

    try {
      startTransition(() => {
        updateCampaignBudget(selectedCampaign.id, newBudget);
      });

      log.info("Campaign budget updated", {
        campaignId: selectedCampaign.id,
        newBudget,
      });
      addToast({
        title: "성공",
        description: "예산이 업데이트되었습니다",
        color: "success",
      });
      onOpenChange();
    } catch (error) {
      log.error("Failed to update budget", error);
      addToast({
        title: "오류",
        description: "예산 업데이트에 실패했습니다",
        color: "danger",
      });
    }
  }, [selectedCampaign, budgetInput, updateCampaignBudget, onOpenChange]);

  const handleStatusToggle = useCallback(
    async (campaign: Campaign) => {
      try {
        startTransition(() => {
          updateCampaignStatus(
            campaign.id,
            !campaign.isActive ? "ENABLED" : "PAUSED",
          );
        });

        log.info("Campaign status toggled", {
          campaignId: campaign.id,
          newStatus: !campaign.isActive,
        });
        addToast({
          title: "성공",
          description: `캠페인이 ${!campaign.isActive ? "활성화" : "비활성화"}되었습니다`,
          color: "success",
        });
      } catch (error) {
        log.error("Failed to toggle campaign status", error);
        addToast({
          title: "오류",
          description: "캠페인 상태 변경에 실패했습니다",
          color: "danger",
        });
      }
    },
    [updateCampaignStatus],
  );

  const renderCell = useCallback(
    (campaign: Campaign, columnKey: string) => {
      switch (columnKey) {
        case "name":
          return (
            <div className="flex flex-col">
              <p className="text-bold text-sm">{campaign.name}</p>
              <p className="text-tiny text-default-400">
                {campaign.platformCampaignId}
              </p>
            </div>
          );
        case "platform":
          return <PlatformBadge platform={campaign.platform} />;
        case "status":
          return (
            <Chip
              color={campaign.isActive ? "success" : "default"}
              size="sm"
              variant="flat"
            >
              {campaign.isActive ? "활성" : "비활성"}
            </Chip>
          );
        case "budget":
          return (
            <div className="text-right">
              {campaign.budget?.toLocaleString() || "-"} 원
            </div>
          );
        case "metrics":
          return (
            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="text-default-400">노출:</span>{" "}
                {(campaign.metrics?.impressions || 0).toLocaleString()}
              </div>
              <div>
                <span className="text-default-400">클릭:</span>{" "}
                {(campaign.metrics?.clicks || 0).toLocaleString()}
              </div>
            </div>
          );
        case "actions":
          return (
            <TableActions
              actions={[
                {
                  icon: <FaDollarSign />,
                  label: "예산 수정",
                  onPress: () => handleBudgetEdit(campaign),
                },
                {
                  icon: campaign.isActive ? <FaPowerOff /> : <FaCheck />,
                  label: campaign.isActive ? "비활성화" : "활성화",
                  onPress: () => handleStatusToggle(campaign),
                  color: campaign.isActive ? "danger" : "success",
                },
              ]}
            />
          );
        default:
          return null;
      }
    },
    [handleBudgetEdit, handleStatusToggle],
  );

  // Platform campaign counts - memoized
  const campaignCounts = useMemo(
    () =>
      campaigns.reduce(
        (acc, campaign) => {
          acc[campaign.platform] = (acc[campaign.platform] || 0) + 1;

          return acc;
        },
        {} as Record<PlatformType, number>,
      ),
    [campaigns],
  );

  // Use stats from store
  const totalStats = useMemo(
    () => ({
      totalBudget: stats?.totalBudget || 0,
      totalSpend: stats?.totalSpend || 0,
      totalImpressions: stats?.totalImpressions || 0,
      totalClicks: stats?.totalClicks || 0,
    }),
    [stats],
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="총 예산"
              value={`${totalStats.totalBudget.toLocaleString()}원`}
            />
            <StatCard
              label="총 지출"
              value={`${totalStats.totalSpend.toLocaleString()}원`}
            />
            <StatCard
              label="총 노출수"
              value={totalStats.totalImpressions.toLocaleString()}
            />
            <StatCard
              label="총 클릭수"
              value={totalStats.totalClicks.toLocaleString()}
            />
          </>
        )}
      </div>

      {/* Platform Tabs with Campaigns */}
      <Card>
        <CardBody>
          <div className="flex flex-col gap-4">
            {/* Filter Input */}
            <div className="flex gap-4 items-center">
              <Input
                className="max-w-xs"
                placeholder="캠페인 검색..."
                startContent={<FaFilter />}
                value={filterInput}
                onChange={(e) => setFilterInput(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  color={filters.isActive === true ? "success" : "default"}
                  size="sm"
                  variant={filters.isActive === true ? "flat" : "light"}
                  onPress={() => setFilters({ isActive: true })}
                >
                  활성
                </Button>
                <Button
                  color={filters.isActive === false ? "danger" : "default"}
                  size="sm"
                  variant={filters.isActive === false ? "flat" : "light"}
                  onPress={() => setFilters({ isActive: false })}
                >
                  비활성
                </Button>
                <Button
                  size="sm"
                  variant="light"
                  onPress={() =>
                    setFilters({ isActive: undefined, search: "" })
                  }
                >
                  초기화
                </Button>
              </div>
            </div>

            {/* Platform Tabs */}
            <Tabs
              aria-label="플랫폼별 캠페인"
              onSelectionChange={(key) =>
                setFilters({
                  platform: key === "all" ? undefined : (key as PlatformType),
                })
              }
            >
              <Tab
                key="all"
                title={
                  <div className="flex items-center gap-2">
                    <span>전체</span>
                    <Chip size="sm">{campaigns.length}</Chip>
                  </div>
                }
              >
                {isLoading ? (
                  <TableSkeleton columns={6} rows={5} />
                ) : (
                  <InfiniteScrollTable
                    aria-label="캠페인 목록"
                    columns={columns}
                    emptyContent="캠페인이 없습니다"
                    hasMore={hasMore}
                    isLoading={list.isLoading || isPending}
                    items={list}
                    renderCell={renderCell}
                    onLoadMore={() => list.loadMore()}
                  />
                )}
              </Tab>
              {Object.entries(campaignCounts).map(([platform, count]) => {
                const config = getPlatformConfig(platform as PlatformType);

                return (
                  <Tab
                    key={platform}
                    title={
                      <div className="flex items-center gap-2">
                        <span>{config.name}</span>
                        <Chip size="sm">{count}</Chip>
                      </div>
                    }
                  >
                    {isLoading ? (
                      <TableSkeleton columns={6} rows={5} />
                    ) : (
                      <InfiniteScrollTable
                        aria-label={`${config.name} 캠페인 목록`}
                        columns={columns}
                        emptyContent={`${config.name} 캠페인이 없습니다`}
                        hasMore={hasMore}
                        isLoading={list.isLoading || isPending}
                        items={list}
                        renderCell={renderCell}
                        onLoadMore={() => list.loadMore()}
                      />
                    )}
                  </Tab>
                );
              })}
            </Tabs>
          </div>
        </CardBody>
      </Card>

      {/* Budget Edit Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                예산 수정
              </ModalHeader>
              <ModalBody>
                <p className="text-sm text-default-500">
                  {selectedCampaign?.name}
                </p>
                <Input
                  endContent={<span className="text-default-400">원</span>}
                  label="새 예산"
                  placeholder="0"
                  type="number"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  취소
                </Button>
                <Button color="primary" onPress={handleBudgetUpdate}>
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
