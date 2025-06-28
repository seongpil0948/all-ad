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
import { useDictionary } from "@/hooks/use-dictionary";

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
  const { dictionary: dict } = useDictionary();

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
  useFilterUrlSync(filters as Record<string, unknown>, setFilters);

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
    { key: "name", label: dict.campaigns.table.name },
    { key: "platform", label: dict.campaigns.table.platform },
    { key: "status", label: dict.campaigns.table.status },
    { key: "budget", label: dict.campaigns.table.budget },
    { key: "metrics", label: dict.campaigns.table.metrics },
    { key: "actions", label: dict.campaigns.table.actions },
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
        title: dict.common.error,
        description: dict.campaigns.toast.invalidBudget,
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
        title: dict.common.success,
        description: dict.campaigns.toast.budgetUpdateSuccess,
        color: "success",
      });
      onOpenChange();
    } catch (error) {
      log.error("Failed to update budget", error);
      addToast({
        title: dict.common.error,
        description: dict.campaigns.toast.budgetUpdateError,
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
          title: dict.common.success,
          description: dict.campaigns.toast.statusChangeSuccess.replace(
            "{{status}}",
            !campaign.isActive
              ? dict.campaigns.statusModal.activate + "d"
              : dict.campaigns.statusModal.deactivate + "d",
          ),
          color: "success",
        });
      } catch (error) {
        log.error("Failed to toggle campaign status", error);
        addToast({
          title: dict.common.error,
          description: dict.campaigns.toast.statusChangeError,
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
              {campaign.isActive
                ? dict.campaigns.status.active
                : dict.campaigns.status.paused}
            </Chip>
          );
        case "budget":
          return (
            <div className="text-right">
              {campaign.budget?.toLocaleString() || "-"}{" "}
              {dict.campaigns.metrics.won}
            </div>
          );
        case "metrics":
          return (
            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="text-default-400">
                  {dict.campaigns.table.impressionsLabel}
                </span>{" "}
                {(campaign.metrics?.impressions || 0).toLocaleString()}
              </div>
              <div>
                <span className="text-default-400">
                  {dict.campaigns.table.clicksLabel}
                </span>{" "}
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
                  label: dict.campaigns.actionLabels.editBudget,
                  onPress: () => handleBudgetEdit(campaign),
                },
                {
                  icon: campaign.isActive ? <FaPowerOff /> : <FaCheck />,
                  label: campaign.isActive
                    ? dict.campaigns.actionLabels.deactivate
                    : dict.campaigns.actionLabels.activate,
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
              label={dict.campaigns.metrics.totalBudgetLabel}
              value={`${totalStats.totalBudget.toLocaleString()}${dict.campaigns.metrics.won}`}
            />
            <StatCard
              label={dict.campaigns.metrics.totalSpendLabel}
              value={`${totalStats.totalSpend.toLocaleString()}${dict.campaigns.metrics.won}`}
            />
            <StatCard
              label={dict.campaigns.metrics.totalImpressionsLabel}
              value={totalStats.totalImpressions.toLocaleString()}
            />
            <StatCard
              label={dict.campaigns.metrics.totalClicksLabel}
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
                placeholder={dict.campaigns.search.placeholder}
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
                  {dict.campaigns.filters.active}
                </Button>
                <Button
                  color={filters.isActive === false ? "danger" : "default"}
                  size="sm"
                  variant={filters.isActive === false ? "flat" : "light"}
                  onPress={() => setFilters({ isActive: false })}
                >
                  {dict.campaigns.filters.paused}
                </Button>
                <Button
                  size="sm"
                  variant="light"
                  onPress={() =>
                    setFilters({ isActive: undefined, search: "" })
                  }
                >
                  {dict.common.reset}
                </Button>
              </div>
            </div>

            {/* Platform Tabs */}
            <Tabs
              aria-label={dict.campaigns.table.platform}
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
                    <span>{dict.common.all}</span>
                    <Chip size="sm">{campaigns.length}</Chip>
                  </div>
                }
              >
                {isLoading ? (
                  <TableSkeleton columns={6} rows={5} />
                ) : (
                  <InfiniteScrollTable
                    aria-label={dict.campaigns.title}
                    columns={columns}
                    emptyContent={dict.campaigns.table.noCampaigns}
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
                {dict.campaigns.budgetModal.title}
              </ModalHeader>
              <ModalBody>
                <p className="text-sm text-default-500">
                  {selectedCampaign?.name}
                </p>
                <Input
                  endContent={
                    <span className="text-default-400">
                      {dict.campaigns.metrics.won}
                    </span>
                  }
                  label={dict.campaigns.budgetModal.newBudgetLabel}
                  placeholder={dict.campaigns.budgetModal.newBudgetPlaceholder}
                  type="number"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  {dict.campaigns.budgetModal.cancel}
                </Button>
                <Button color="primary" onPress={handleBudgetUpdate}>
                  {dict.campaigns.budgetModal.update}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
