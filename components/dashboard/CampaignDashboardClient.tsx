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
import { useShallow } from "zustand/shallow";
import { FaFilter, FaDollarSign, FaPowerOff, FaCheck } from "react-icons/fa";

import { Campaign, CampaignStats } from "@/types/campaign.types";
import { PlatformType } from "@/types";
import { useCampaignStore } from "@/stores/useCampaignStore";
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
import { useDictionary } from "@/hooks/use-dictionary";

interface CampaignDashboardClientProps {
  initialCampaigns: Campaign[];
  initialStats: CampaignStats;
}

export function CampaignDashboardClient({
  initialCampaigns,
  initialStats,
}: CampaignDashboardClientProps) {
  const [isPending, startTransition] = useTransition();
  const { dictionary: dict } = useDictionary();

  const {
    campaigns,
    stats,
    filters,
    isLoading,
    applyFilters,
    updateBudget,
    toggleStatus,
    setCampaigns,
    setStats,
  } = useCampaignStore(
    useShallow((state) => ({
      campaigns: state.campaigns,
      stats: state.stats,
      filters: state.filters,
      isLoading: state.isLoading,
      applyFilters: state.applyFilters,
      updateBudget: state.updateBudget,
      toggleStatus: state.toggleStatus,
      setCampaigns: state.setCampaigns,
      setStats: state.setStats,
    })),
  );

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null,
  );
  const [budgetInput, setBudgetInput] = useState("");
  const [filterInput, setFilterInput] = useState("");

  // Initialize store with server-side props
  useEffect(() => {
    setCampaigns(initialCampaigns);
    setStats(initialStats);
  }, []);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      startTransition(() => {
        applyFilters({ search: filterInput });
      });
    }, 300);
    return () => clearTimeout(handler);
  }, [filterInput, applyFilters]);

  // Reset modal state on close
  useEffect(() => {
    if (!isOpen) {
      setSelectedCampaign(null);
      setBudgetInput("");
    }
  }, [isOpen]);

  const columns: InfiniteScrollTableColumn<Campaign>[] = useMemo(
    () => [
      { key: "name", label: dict.campaigns.table.name },
      { key: "platform", label: dict.campaigns.table.platform },
      { key: "status", label: dict.campaigns.table.status },
      { key: "budget", label: dict.campaigns.table.budget },
      { key: "metrics", label: dict.campaigns.table.metrics },
      { key: "actions", label: dict.campaigns.table.actions },
    ],
    [dict],
  );

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
    await updateBudget(selectedCampaign.id, newBudget);
    onOpenChange();
  }, [selectedCampaign, budgetInput, updateBudget, onOpenChange]);

  const handleStatusToggle = useCallback(
    async (campaign: Campaign) => {
      await toggleStatus(campaign.id, campaign.is_active ?? false);
    },
    [toggleStatus],
  );

  const renderCell = useCallback(
    (campaign: Campaign, columnKey: string) => {
      switch (columnKey) {
        case "name":
          return (
            <div className="flex flex-col">
              <p className="text-bold text-sm">{campaign.name}</p>
              <p className="text-tiny text-default-400">
                {campaign.platform_campaign_id}
              </p>
            </div>
          );
        case "platform":
          return <PlatformBadge platform={campaign.platform} />;
        case "status":
          return (
            <Chip
              color={campaign.is_active ? "success" : "default"}
              size="sm"
              variant="flat"
            >
              {campaign.is_active
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
                  icon: campaign.is_active ? <FaPowerOff /> : <FaCheck />,
                  label: campaign.is_active
                    ? dict.campaigns.actionLabels.deactivate
                    : dict.campaigns.actionLabels.activate,
                  onPress: () => handleStatusToggle(campaign),
                  color: campaign.is_active ? "danger" : "success",
                },
              ]}
            />
          );
        default:
          return null;
      }
    },
    [handleBudgetEdit, handleStatusToggle, dict],
  );

  const campaignCounts = useMemo(
    () =>
      campaigns.reduce(
        (acc, campaign) => {
          acc[campaign.platform] = (acc[campaign.platform] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    [campaigns],
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isPending || !stats ? (
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
              value={`${stats.totalBudget.toLocaleString()}${dict.campaigns.metrics.won}`}
            />
            <StatCard
              label={dict.campaigns.metrics.totalSpendLabel}
              value={`${stats.totalSpend.toLocaleString()}${dict.campaigns.metrics.won}`}
            />
            <StatCard
              label={dict.campaigns.metrics.totalImpressionsLabel}
              value={stats.totalImpressions.toLocaleString()}
            />
            <StatCard
              label={dict.campaigns.metrics.totalClicksLabel}
              value={stats.totalClicks.toLocaleString()}
            />
          </>
        )}
      </div>

      <Card>
        <CardBody>
          <div className="flex flex-col gap-4">
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
                  onPress={() => applyFilters({ isActive: true })}
                >
                  {dict.campaigns.filters.active}
                </Button>
                <Button
                  color={filters.isActive === false ? "danger" : "default"}
                  size="sm"
                  variant={filters.isActive === false ? "flat" : "light"}
                  onPress={() => applyFilters({ isActive: false })}
                >
                  {dict.campaigns.filters.paused}
                </Button>
                <Button
                  size="sm"
                  variant="light"
                  onPress={() =>
                    applyFilters({ isActive: undefined, search: "" })
                  }
                >
                  {dict.common.reset}
                </Button>
              </div>
            </div>

            <Tabs
              aria-label={dict.campaigns.table.platform}
              onSelectionChange={(key) =>
                applyFilters({
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
                  <VirtualScrollTable
                    aria-label={dict.campaigns.title}
                    columns={columns}
                    emptyContent={dict.campaigns.table.noCampaigns}
                    items={campaigns}
                    renderCell={renderCell}
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
                      <VirtualScrollTable
                        aria-label={`${config.name} 캠페인 목록`}
                        columns={columns}
                        emptyContent={`${config.name} 캠페인이 없습니다`}
                        items={campaigns.filter((c) => c.platform === platform)}
                        renderCell={renderCell}
                      />
                    )}
                  </Tab>
                );
              })}
            </Tabs>
          </div>
        </CardBody>
      </Card>

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
