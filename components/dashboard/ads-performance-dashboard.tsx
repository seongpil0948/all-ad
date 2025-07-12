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
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 헤더 */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">광고 성과 대시보드</h1>
          <p className="text-gray-600">
            모든 광고 플랫폼의 성과를 한눈에 확인하세요
          </p>
        </div>
        <div className="flex items-center gap-2">
          {enableRealtime && (
            <Switch
              isSelected={autoRefresh}
              size="sm"
              onValueChange={setAutoRefresh}
            >
              실시간 업데이트
            </Switch>
          )}
          <Button
            size="sm"
            startContent={<Filter className="w-4 h-4" />}
            variant="light"
            onClick={() => setShowFilters(!showFilters)}
          >
            필터
          </Button>
          <Button
            size="sm"
            startContent={<Download className="w-4 h-4" />}
            variant="light"
            onClick={onExportOpen}
          >
            내보내기
          </Button>
          <Button
            size="sm"
            startContent={<Settings className="w-4 h-4" />}
            variant="light"
            onClick={onSettingsOpen}
          >
            설정
          </Button>
          <Button
            isLoading={loading}
            size="sm"
            startContent={<RefreshCw className="w-4 h-4" />}
            variant="light"
            onClick={() => loadData()}
          >
            새로고침
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
                ? "업데이트 중..."
                : `마지막 업데이트: ${lastUpdated.toLocaleTimeString()}`}
            </span>
          </div>
          {autoRefresh && (
            <Badge color="success" variant="flat">
              실시간
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
            <h3 className="text-lg font-semibold">필터 및 옵션</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select
                label="기간"
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
                label="계정"
                selectedKeys={filters.accounts}
                selectionMode="multiple"
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
                label="그룹화"
                value={filters.groupBy}
                onChange={(e) =>
                  handleFiltersChange({
                    groupBy: e.target.value as DashboardFilters["groupBy"],
                  })
                }
              >
                <SelectItem key="platform">플랫폼별</SelectItem>
                <SelectItem key="account">계정별</SelectItem>
                <SelectItem key="campaign">캠페인별</SelectItem>
                <SelectItem key="date">날짜별</SelectItem>
              </Select>

              <Select
                label="차트 타입"
                value={selectedChartType}
                onChange={(e) =>
                  setSelectedChartType(e.target.value as ChartType)
                }
              >
                <SelectItem key="bar">막대 차트</SelectItem>
                <SelectItem key="line">선 차트</SelectItem>
                <SelectItem key="area">영역 차트</SelectItem>
                <SelectItem key="pie">원형 차트</SelectItem>
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
              <h3 className="text-lg font-semibold">알림</h3>
              <div className="flex items-center gap-2">
                <Badge color="danger" variant="flat">
                  {alertStats.critical}
                </Badge>
                <Badge color="warning" variant="flat">
                  {alertStats.warning}
                </Badge>
                <Badge color="primary" variant="flat">
                  {alertStats.unacknowledged} 미확인
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
                        확인
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
              <div className="text-small text-gray-500">총 광고비</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">
                {performanceSummary.totalImpressions.toLocaleString()}
              </div>
              <div className="text-small text-gray-500">총 노출수</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <Target className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">
                {performanceSummary.totalConversions.toLocaleString()}
              </div>
              <div className="text-small text-gray-500">총 전환수</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold">
                {performanceSummary.averageRoas.toFixed(2)}
              </div>
              <div className="text-small text-gray-500">평균 ROAS</div>
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
                    ? "우수"
                    : performanceSummary.efficiency === "good"
                      ? "양호"
                      : "개선필요"}
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
            <Tab key="overview" title="전체 개요" />
            <Tab key="platforms" title="플랫폼별" />
            <Tab key="trends" title="트렌드 분석" />
            <Tab key="performance" title="성과 분석" />
          </Tabs>
        </CardHeader>
        <CardBody>
          {error && (
            <div className="text-center py-8">
              <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <div className="text-lg font-semibold mb-2">
                오류가 발생했습니다
              </div>
              <div className="text-gray-600 mb-4">{error}</div>
              <Button color="primary" onClick={() => loadData()}>
                다시 시도
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
                <span className="text-small text-gray-500">플랫폼 선택:</span>
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
                    플랫폼 데이터를 불러오는 중...
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedTab === "trends" && (
            <div className="text-center py-8">
              <LineChart className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <div className="text-lg font-semibold mb-2">트렌드 분석</div>
              <div className="text-gray-600">
                시계열 데이터를 분석하여 트렌드를 표시합니다.
              </div>
            </div>
          )}

          {selectedTab === "performance" && (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <div className="text-lg font-semibold mb-2">성과 분석</div>
              <div className="text-gray-600">
                상세한 성과 분석 및 최적화 제안을 표시합니다.
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* 내보내기 모달 */}
      <Modal isOpen={isExportOpen} onClose={onExportClose}>
        <ModalContent>
          <ModalHeader>데이터 내보내기</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  htmlFor="export-format"
                >
                  내보내기 형식
                </label>
                <div className="grid grid-cols-2 gap-2" id="export-format">
                  <Button variant="light" onClick={() => handleExport("csv")}>
                    CSV
                  </Button>
                  <Button variant="light" onClick={() => handleExport("xlsx")}>
                    Excel
                  </Button>
                  <Button variant="light" onClick={() => handleExport("json")}>
                    JSON
                  </Button>
                  <Button variant="light" onClick={() => handleExport("pdf")}>
                    PDF
                  </Button>
                </div>
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  htmlFor="export-data-type"
                >
                  포함할 데이터
                </label>
                <div className="space-y-2" id="export-data-type">
                  <Switch defaultSelected id="summary-export">
                    요약 데이터
                  </Switch>
                  <Switch defaultSelected id="detailed-export">
                    상세 데이터
                  </Switch>
                  <Switch id="charts-export">차트 이미지</Switch>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onClick={onExportClose}>
              취소
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 설정 모달 */}
      <Modal isOpen={isSettingsOpen} onClose={onSettingsClose}>
        <ModalContent>
          <ModalHeader>대시보드 설정</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <Switch
                  id="auto-refresh-switch"
                  isSelected={autoRefresh}
                  onValueChange={setAutoRefresh}
                >
                  자동 새로고침
                </Switch>
              </div>
              <div>
                <Input
                  id="refresh-interval-input"
                  label="새로고침 간격 (초)"
                  max="300"
                  min="10"
                  type="number"
                  value={realtimeInterval.toString()}
                  onChange={() => {
                    // 실제 구현에서는 상위 컴포넌트로 전달
                  }}
                />
              </div>
              <div>
                <Select
                  aria-labelledby="theme-select-label"
                  id="theme-select"
                  label="테마"
                  value={theme}
                >
                  <SelectItem key="light">라이트</SelectItem>
                  <SelectItem key="dark">다크</SelectItem>
                  <SelectItem key="auto">자동</SelectItem>
                </Select>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onClick={onSettingsClose}>
              취소
            </Button>
            <Button color="primary" onClick={onSettingsClose}>
              저장
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
