"use client";

import type {
  MultiPlatformMetrics,
  AggregatedMetrics,
  AdPlatform,
  DateRange,
  DashboardFilters,
  MetricsAlert,
  ChartType,
  MetricsApiResponse,
} from "@/types/ads-metrics.types";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Switch } from "@heroui/switch";
import { Tabs, Tab } from "@heroui/tabs";
import { Badge } from "@heroui/badge";
import { Input } from "@heroui/input";
import { Chip } from "@heroui/chip";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import {
  RefreshCw,
  Download,
  Settings,
  Filter,
  TrendingUp,
  AlertTriangle,
  XCircle,
  DollarSign,
  Target,
  BarChart3,
  LineChart,
} from "lucide-react";

import { MultiPlatformChart } from "@/components/charts/multi-platform-chart";
import { PlatformPerformanceChart } from "@/components/charts/platform-performance-chart";
import { useDictionary } from "@/hooks/use-dictionary";

interface AdsPerformanceDashboardProps {
  initialData?: MultiPlatformMetrics;
  initialFilters?: DashboardFilters;
  platforms?: AdPlatform[];
  accounts?: Array<{ id: string; name: string; platform: AdPlatform }>;
  onDataLoad?: (filters: DashboardFilters) => Promise<MetricsApiResponse>;
  onExport?: (data: MultiPlatformMetrics, format: string) => void;
  showAlerts?: boolean;
  alerts?: MetricsAlert[];
  onAlertAcknowledge?: (alertId: string) => void;
  enableRealtime?: boolean;
  realtimeInterval?: number;
  theme?: "light" | "dark" | "auto";
  className?: string;
}

const DEFAULT_PLATFORMS: AdPlatform[] = [
  "google_ads",
  "meta_ads",
  "tiktok_ads",
  "amazon_ads",
];

const PLATFORM_CONFIGS = {
  google_ads: { name: "Google Ads", color: "#4285f4", icon: "🔍" },
  meta_ads: { name: "Meta Ads", color: "#1877f2", icon: "👥" },
  tiktok_ads: { name: "TikTok Ads", color: "#ff0050", icon: "🎵" },
  amazon_ads: { name: "Amazon Ads", color: "#ff9900", icon: "📦" },
} as const;

const DATE_RANGES = [
  { key: "LAST_7_DAYS", label: "지난 7일" },
  { key: "LAST_30_DAYS", label: "지난 30일" },
  { key: "LAST_90_DAYS", label: "지난 90일" },
  { key: "CUSTOM", label: "사용자 정의" },
] as const;

const ALERT_TYPES = {
  performance_drop: { label: "성과 하락", color: "danger", icon: TrendingUp },
  budget_exceeded: { label: "예산 초과", color: "warning", icon: DollarSign },
  conversion_spike: { label: "전환 급증", color: "success", icon: Target },
  cpc_increase: { label: "CPC 증가", color: "warning", icon: BarChart3 },
  custom: { label: "사용자 정의", color: "primary", icon: AlertTriangle },
} as const;

export function AdsPerformanceDashboard({
  initialData,
  initialFilters,
  platforms = DEFAULT_PLATFORMS,
  accounts = [],
  onDataLoad,
  onExport,
  showAlerts = true,
  alerts = [],
  onAlertAcknowledge,
  enableRealtime = false,
  realtimeInterval = 30000,
  theme = "auto",
  className,
}: AdsPerformanceDashboardProps) {
  const { dictionary } = useDictionary();
  const SELECTION_MULTIPLE = "multiple" as const;
  const ID = {
    exportFormat: "export-format",
    exportDataType: "export-data-type",
    refreshIntervalInput: "refresh-interval-input",
    themeSelectLabel: "theme-select-label",
  } as const;
  // State
  const [data, setData] = useState<MultiPlatformMetrics | null>(
    initialData || null,
  );
  const [platformData, setPlatformData] = useState<
    Record<AdPlatform, AggregatedMetrics | null>
  >({
    google_ads: null,
    meta_ads: null,
    tiktok_ads: null,
    amazon_ads: null,
  });
  const [filters, setFilters] = useState<DashboardFilters>(
    initialFilters || {
      platforms: platforms,
      dateRange: "LAST_30_DAYS",
      accounts: [],
      campaigns: [],
      metrics: ["impressions", "clicks", "cost", "conversions", "ctr", "roas"],
      groupBy: "platform",
      sortBy: { field: "cost", direction: "desc" },
    },
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>("overview");
  const [selectedPlatform, setSelectedPlatform] =
    useState<AdPlatform>("google_ads");
  const [autoRefresh, setAutoRefresh] = useState(enableRealtime);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [showFilters, setShowFilters] = useState(false);
  const [selectedChartType, setSelectedChartType] = useState<ChartType>("bar");

  // Modal controls
  const {
    isOpen: isSettingsOpen,
    onOpen: onSettingsOpen,
    onClose: onSettingsClose,
  } = useDisclosure();
  const {
    isOpen: isExportOpen,
    onOpen: onExportOpen,
    onClose: onExportClose,
  } = useDisclosure();

  // 데이터 로드
  const loadData = useCallback(
    async (newFilters?: DashboardFilters) => {
      if (!onDataLoad) return;

      setLoading(true);
      setError(null);

      try {
        const filtersToUse = newFilters || filters;
        const response = await onDataLoad(filtersToUse);

        if (response.success && response.data) {
          if ("platformBreakdown" in response.data) {
            setData(response.data as MultiPlatformMetrics);
          } else {
            // 개별 플랫폼 데이터 처리
            const platformMetrics = response.data as AggregatedMetrics;

            setPlatformData((prev) => ({
              ...prev,
              [platformMetrics.platform]: platformMetrics,
            }));
          }
          setLastUpdated(new Date());
        } else {
          setError(
            response.error || "데이터를 불러오는 중 오류가 발생했습니다.",
          );
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "알 수 없는 오류가 발생했습니다.",
        );
      } finally {
        setLoading(false);
      }
    },
    [onDataLoad, filters],
  );

  // 자동 새로고침
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadData();
      }, realtimeInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, realtimeInterval, loadData]);

  // 필터 변경 핸들러
  const handleFiltersChange = useCallback(
    (newFilters: Partial<DashboardFilters>) => {
      const updatedFilters = { ...filters, ...newFilters };

      setFilters(updatedFilters);
      loadData(updatedFilters);
    },
    [filters, loadData],
  );

  // 플랫폼 선택 핸들러
  const handlePlatformSelect = useCallback(
    (platform: AdPlatform) => {
      setSelectedPlatform(platform);

      // 해당 플랫폼 데이터가 없으면 로드
      if (!platformData[platform]) {
        const platformFilters = { ...filters, platforms: [platform] };

        loadData(platformFilters);
      }
    },
    [filters, loadData, platformData],
  );

  // 알림 통계
  const alertStats = useMemo(() => {
    const stats = {
      total: alerts.length,
      critical: alerts.filter((a) => a.severity === "critical").length,
      warning: alerts.filter((a) => a.severity === "warning").length,
      unacknowledged: alerts.filter((a) => !a.acknowledged).length,
    };

    return stats;
  }, [alerts]);

  // 성과 요약
  const performanceSummary = useMemo(() => {
    if (!data) return null;

    const summary = {
      totalSpend: data.totalCost,
      totalImpressions: data.totalImpressions,
      totalClicks: data.totalClicks,
      totalConversions: data.totalConversions,
      averageCtr: data.overallCtr,
      averageRoas: data.overallRoas,
      topPlatform: data.platformBreakdown.reduce((top, current) =>
        current.totalCost > top.totalCost ? current : top,
      ),
      efficiency:
        data.overallRoas > 3
          ? "excellent"
          : data.overallRoas > 2
            ? "good"
            : "needs_improvement",
    };

    return summary;
  }, [data]);

  // 내보내기 핸들러
  const handleExport = useCallback(
    (format: string) => {
      if (onExport && data) {
        onExport(data, format);
      }
      onExportClose();
    },
    [onExport, data, onExportClose],
  );

  // 초기 데이터 로드
  useEffect(() => {
    if (!initialData && onDataLoad) {
      loadData();
    }
  }, [initialData, loadData, onDataLoad]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 헤더 */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">
            {dictionary.adsPerformanceDashboard.title}
          </h1>
          <p className="text-gray-600">
            {dictionary.adsPerformanceDashboard.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {enableRealtime && (
            <Switch
              isSelected={autoRefresh}
              size="sm"
              onValueChange={setAutoRefresh}
            >
              {dictionary.adsPerformanceDashboard.realtimeUpdate}
            </Switch>
          )}
          <Button
            size="sm"
            startContent={<Filter className="w-4 h-4" />}
            variant="light"
            onClick={() => setShowFilters(!showFilters)}
          >
            {dictionary.adsPerformanceDashboard.filter}
          </Button>
          <Button
            size="sm"
            startContent={<Download className="w-4 h-4" />}
            variant="light"
            onClick={onExportOpen}
          >
            {dictionary.adsPerformanceDashboard.export}
          </Button>
          <Button
            size="sm"
            startContent={<Settings className="w-4 h-4" />}
            variant="light"
            onClick={onSettingsOpen}
          >
            {dictionary.adsPerformanceDashboard.settings}
          </Button>
          <Button
            isLoading={loading}
            size="sm"
            startContent={<RefreshCw className="w-4 h-4" />}
            variant="light"
            onClick={() => loadData()}
          >
            {dictionary.adsPerformanceDashboard.refresh}
          </Button>
        </div>
      </div>

      {/* 상태 표시줄 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${loading ? "bg-yellow-500" : "bg-green-500"}`}
            />
            <span className="text-small text-gray-600">
              {loading
                ? dictionary.adsPerformanceDashboard.updating
                : `${dictionary.adsPerformanceDashboard.lastUpdate.replace("{{time}}", lastUpdated.toLocaleTimeString())}`}
            </span>
          </div>
          {autoRefresh && (
            <Badge color="success" variant="flat">
              {dictionary.adsPerformanceDashboard.realtime}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {platforms.map((platform) => (
            <Chip
              key={platform}
              className="text-white"
              size="sm"
              style={{ backgroundColor: PLATFORM_CONFIGS[platform].color }}
            >
              {PLATFORM_CONFIGS[platform].icon}{" "}
              {PLATFORM_CONFIGS[platform].name}
            </Chip>
          ))}
        </div>
      </div>

      {/* 필터 패널 */}
      {showFilters && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">
              {dictionary.adsPerformanceDashboard.filtersAndOptions}
            </h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select
                label={dictionary.adsPerformanceDashboard.period}
                value={filters.dateRange}
                onChange={(e) =>
                  handleFiltersChange({
                    dateRange: e.target.value as DateRange,
                  })
                }
              >
                {DATE_RANGES.map((range) => (
                  <SelectItem key={range.key}>{range.label}</SelectItem>
                ))}
              </Select>

              <Select
                label={dictionary.adsPerformanceDashboard.account}
                selectedKeys={filters.accounts}
                selectionMode={SELECTION_MULTIPLE}
                onSelectionChange={(keys) =>
                  handleFiltersChange({
                    accounts: Array.from(keys) as string[],
                  })
                }
              >
                {accounts.map((account) => (
                  <SelectItem key={account.id}>
                    {account.name} ({PLATFORM_CONFIGS[account.platform].name})
                  </SelectItem>
                ))}
              </Select>

              <Select
                label={dictionary.adsPerformanceDashboard.groupBy}
                value={filters.groupBy}
                onChange={(e) =>
                  handleFiltersChange({
                    groupBy: e.target.value as DashboardFilters["groupBy"],
                  })
                }
              >
                <SelectItem key="platform">
                  {dictionary.adsPerformanceDashboard.byPlatform}
                </SelectItem>
                <SelectItem key="account">
                  {dictionary.adsPerformanceDashboard.byAccount}
                </SelectItem>
                <SelectItem key="campaign">
                  {dictionary.adsPerformanceDashboard.byCampaign}
                </SelectItem>
                <SelectItem key="date">
                  {dictionary.adsPerformanceDashboard.byDate}
                </SelectItem>
              </Select>

              <Select
                label={dictionary.adsPerformanceDashboard.chartType}
                value={selectedChartType}
                onChange={(e) =>
                  setSelectedChartType(e.target.value as ChartType)
                }
              >
                <SelectItem key="bar">
                  {dictionary.adsPerformanceDashboard.barChart}
                </SelectItem>
                <SelectItem key="line">
                  {dictionary.adsPerformanceDashboard.lineChart}
                </SelectItem>
                <SelectItem key="area">
                  {dictionary.adsPerformanceDashboard.areaChart}
                </SelectItem>
                <SelectItem key="pie">
                  {dictionary.adsPerformanceDashboard.pieChart}
                </SelectItem>
              </Select>
            </div>
          </CardBody>
        </Card>
      )}

      {/* 알림 패널 */}
      {showAlerts && alerts.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {dictionary.adsPerformanceDashboard.notifications}
              </h3>
              <div className="flex items-center gap-2">
                <Badge color="danger" variant="flat">
                  {alertStats.critical}
                </Badge>
                <Badge color="warning" variant="flat">
                  {alertStats.warning}
                </Badge>
                <Badge color="primary" variant="flat">
                  {alertStats.unacknowledged}{" "}
                  {dictionary.adsPerformanceDashboard.unacknowledged}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {alerts.slice(0, 5).map((alert) => {
                const alertConfig = ALERT_TYPES[alert.alertType];
                const AlertIcon = alertConfig.icon;

                return (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-2 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <AlertIcon
                        className={`w-4 h-4 ${
                          alert.severity === "critical"
                            ? "text-red-500"
                            : alert.severity === "warning"
                              ? "text-yellow-500"
                              : "text-blue-500"
                        }`}
                      />
                      <div>
                        <div className="font-medium">{alert.message}</div>
                        <div className="text-small text-gray-500">
                          {PLATFORM_CONFIGS[alert.platform].name} •{" "}
                          {new Date(alert.triggeredAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {!alert.acknowledged && onAlertAcknowledge && (
                      <Button
                        size="sm"
                        variant="light"
                        onClick={() => onAlertAcknowledge(alert.id)}
                      >
                        {dictionary.adsPerformanceDashboard.acknowledge}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* 성과 요약 */}
      {performanceSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardBody className="text-center">
              <DollarSign className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold">
                ₩{performanceSummary.totalSpend.toLocaleString()}
              </div>
              <div className="text-small text-gray-500">
                {dictionary.adsPerformanceDashboard.totalSpend}
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">
                {performanceSummary.totalImpressions.toLocaleString()}
              </div>
              <div className="text-small text-gray-500">
                {dictionary.adsPerformanceDashboard.totalImpressions}
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <Target className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">
                {performanceSummary.totalConversions.toLocaleString()}
              </div>
              <div className="text-small text-gray-500">
                {dictionary.adsPerformanceDashboard.totalConversions}
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold">
                {performanceSummary.averageRoas.toFixed(2)}
              </div>
              <div className="text-small text-gray-500">
                {dictionary.adsPerformanceDashboard.averageRoas}
              </div>
              <div className="mt-2">
                <Chip
                  color={
                    performanceSummary.efficiency === "excellent"
                      ? "success"
                      : performanceSummary.efficiency === "good"
                        ? "warning"
                        : "danger"
                  }
                  size="sm"
                >
                  {performanceSummary.efficiency === "excellent"
                    ? dictionary.adsPerformanceDashboard.excellent
                    : performanceSummary.efficiency === "good"
                      ? dictionary.adsPerformanceDashboard.good
                      : dictionary.adsPerformanceDashboard.needsImprovement}
                </Chip>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* 메인 탭 */}
      <Card>
        <CardHeader>
          <Tabs
            selectedKey={selectedTab}
            onSelectionChange={(key) => setSelectedTab(key as string)}
          >
            <Tab
              key="overview"
              title={dictionary.adsPerformanceDashboard.overview}
            />
            <Tab
              key="platforms"
              title={dictionary.adsPerformanceDashboard.byPlatformTab}
            />
            <Tab
              key="trends"
              title={dictionary.adsPerformanceDashboard.trendAnalysis}
            />
            <Tab
              key="performance"
              title={dictionary.adsPerformanceDashboard.performanceAnalysis}
            />
          </Tabs>
        </CardHeader>
        <CardBody>
          {error && (
            <div className="text-center py-8">
              <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <div className="text-lg font-semibold mb-2">
                {dictionary.adsPerformanceDashboard.errorOccurred}
              </div>
              <div className="text-gray-600 mb-4">{error}</div>
              <Button color="primary" onClick={() => loadData()}>
                {dictionary.adsPerformanceDashboard.retry}
              </Button>
            </div>
          )}

          {selectedTab === "overview" && data && (
            <MultiPlatformChart
              autoRefresh={autoRefresh}
              chartType={selectedChartType}
              data={data}
              error={error ?? undefined}
              loading={loading}
              showMetricsCards={true}
              onRefresh={() => loadData()}
            />
          )}

          {selectedTab === "platforms" && (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <span className="text-small text-gray-500">
                  {dictionary.adsPerformanceDashboard.platformSelect}
                </span>
                {platforms.map((platform) => (
                  <Button
                    key={platform}
                    size="sm"
                    startContent={
                      <span>{PLATFORM_CONFIGS[platform].icon}</span>
                    }
                    variant={selectedPlatform === platform ? "solid" : "light"}
                    onClick={() => handlePlatformSelect(platform)}
                  >
                    {PLATFORM_CONFIGS[platform].name}
                  </Button>
                ))}
              </div>

              {platformData[selectedPlatform] ? (
                <PlatformPerformanceChart
                  chartType={selectedChartType}
                  data={platformData[selectedPlatform]!}
                  error={error ?? undefined}
                  loading={loading}
                  showPerformanceInsights={true}
                  onRefresh={() => loadData()}
                />
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4" />
                  <div className="text-gray-500">
                    {dictionary.adsPerformanceDashboard.loadingPlatformData}
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedTab === "trends" && (
            <div className="text-center py-8">
              <LineChart className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <div className="text-lg font-semibold mb-2">
                {dictionary.adsPerformanceDashboard.trendAnalysisTitle}
              </div>
              <div className="text-gray-600">
                {dictionary.adsPerformanceDashboard.trendAnalysisSubtitle}
              </div>
            </div>
          )}

          {selectedTab === "performance" && (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <div className="text-lg font-semibold mb-2">
                {dictionary.adsPerformanceDashboard.performanceAnalysisTitle}
              </div>
              <div className="text-gray-600">
                {dictionary.adsPerformanceDashboard.performanceAnalysisSubtitle}
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* 내보내기 모달 */}
      <Modal isOpen={isExportOpen} onClose={onExportClose}>
        <ModalContent>
          <ModalHeader>
            {dictionary.adsPerformanceDashboard.exportData}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  htmlFor={ID.exportFormat}
                >
                  {dictionary.adsPerformanceDashboard.exportFormat}
                </label>
                <div className="grid grid-cols-2 gap-2" id={ID.exportFormat}>
                  <Button variant="light" onClick={() => handleExport("csv")}>
                    {dictionary.adsPerformanceDashboard.csv}
                  </Button>
                  <Button variant="light" onClick={() => handleExport("xlsx")}>
                    {dictionary.adsPerformanceDashboard.excel}
                  </Button>
                  <Button variant="light" onClick={() => handleExport("json")}>
                    {dictionary.adsPerformanceDashboard.json}
                  </Button>
                  <Button variant="light" onClick={() => handleExport("pdf")}>
                    {dictionary.adsPerformanceDashboard.pdf}
                  </Button>
                </div>
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  htmlFor={ID.exportDataType}
                >
                  {dictionary.adsPerformanceDashboard.dataToInclude}
                </label>
                <div className="space-y-2" id={ID.exportDataType}>
                  <Switch defaultSelected id="summary-export">
                    {dictionary.adsPerformanceDashboard.summaryData}
                  </Switch>
                  <Switch defaultSelected id="detailed-export">
                    {dictionary.adsPerformanceDashboard.detailedData}
                  </Switch>
                  <Switch id="charts-export">
                    {dictionary.adsPerformanceDashboard.chartImages}
                  </Switch>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onClick={onExportClose}>
              {dictionary.adsPerformanceDashboard.cancel}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 설정 모달 */}
      <Modal isOpen={isSettingsOpen} onClose={onSettingsClose}>
        <ModalContent>
          <ModalHeader>
            {dictionary.adsPerformanceDashboard.dashboardSettings}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <Switch
                  id="auto-refresh-switch"
                  isSelected={autoRefresh}
                  onValueChange={setAutoRefresh}
                >
                  {dictionary.adsPerformanceDashboard.autoRefresh}
                </Switch>
              </div>
              <div>
                <Input
                  id={ID.refreshIntervalInput}
                  label={dictionary.adsPerformanceDashboard.refreshInterval}
                  max={300}
                  min={10}
                  type="number"
                  value={realtimeInterval.toString()}
                  onChange={() => {
                    // 실제 구현에서는 상위 컴포넌트로 전달
                  }}
                />
              </div>
              <div>
                <Select
                  aria-labelledby={ID.themeSelectLabel}
                  id="theme-select"
                  label={dictionary.adsPerformanceDashboard.theme}
                  value={theme}
                >
                  <SelectItem key="light">
                    {dictionary.adsPerformanceDashboard.light}
                  </SelectItem>
                  <SelectItem key="dark">
                    {dictionary.adsPerformanceDashboard.dark}
                  </SelectItem>
                  <SelectItem key="auto">
                    {dictionary.adsPerformanceDashboard.auto}
                  </SelectItem>
                </Select>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onClick={onSettingsClose}>
              {dictionary.adsPerformanceDashboard.cancel}
            </Button>
            <Button color="primary" onClick={onSettingsClose}>
              {dictionary.adsPerformanceDashboard.save}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
