"use client";

import type {
  MultiPlatformMetrics,
  AdPlatform,
  MetricsAlert,
} from "@/types/ads-metrics.types";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Switch } from "@heroui/switch";
import { Tabs, Tab } from "@heroui/tabs";
import { Badge } from "@heroui/badge";
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
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Database,
  BarChart3,
  LineChart,
  PieChart,
} from "lucide-react";

import { AdsPerformanceDashboard } from "@/components/dashboard/ads-performance-dashboard";
import { MultiPlatformChart } from "@/components/charts/multi-platform-chart";
import {
  fetchMultiPlatformMetrics,
  exportMetrics,
} from "@/app/[lang]/lab/actions";

interface CredentialConfig {
  platform: AdPlatform;
  enabled: boolean;
  credentials: Record<string, string>;
}

export default function AnalyticsPage() {
  // State
  const [credentials, setCredentials] = useState<
    Record<AdPlatform, CredentialConfig>
  >({
    google_ads: {
      platform: "google_ads",
      enabled: false,
      credentials: {
        clientId: "",
        clientSecret: "",
        developerToken: "",
        refreshToken: "",
        loginCustomerId: "",
      },
    },
    meta_ads: {
      platform: "meta_ads",
      enabled: false,
      credentials: {
        appId: "",
        appSecret: "",
        accessToken: "",
        businessId: "",
      },
    },
    tiktok_ads: {
      platform: "tiktok_ads",
      enabled: false,
      credentials: {},
    },
    amazon_ads: {
      platform: "amazon_ads",
      enabled: false,
      credentials: {},
    },
  });

  const [selectedAccounts, setSelectedAccounts] = useState<
    Array<{ platform: AdPlatform; accountId: string }>
  >([]);
  const [multiPlatformData, setMultiPlatformData] =
    useState<MultiPlatformMetrics | null>(null);
  const [alerts, setAlerts] = useState<MetricsAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [realtimeEnabled, setRealtimeEnabled] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string>("setup");
  const [demoMode, setDemoMode] = useState(true);

  // Modal 상태 관리
  const {
    isOpen: isCredentialsOpen,
    onOpen: onCredentialsOpen,
    onClose: onCredentialsClose,
  } = useDisclosure();

  const {
    isOpen: isAlertOpen,
    onOpen: onAlertOpen,
    onClose: onAlertClose,
  } = useDisclosure();

  // 데모 데이터 생성
  const generateDemoData = useCallback((): MultiPlatformMetrics => {
    const platforms: AdPlatform[] = [
      "google_ads",
      "meta_ads",
      "tiktok_ads",
      "amazon_ads",
    ];

    const platformBreakdown = platforms.map((platform) => ({
      platform,
      totalImpressions: Math.floor(Math.random() * 100000) + 50000,
      totalClicks: Math.floor(Math.random() * 5000) + 2000,
      totalCost: Math.floor(Math.random() * 500000) + 100000,
      totalConversions: Math.floor(Math.random() * 300) + 50,
      averageCtr: Math.random() * 0.05 + 0.01,
      averageCpc: Math.random() * 2000 + 500,
      averageCpm: Math.random() * 8000 + 2000,
      averageConversionRate: Math.random() * 0.08 + 0.02,
      averageCostPerConversion: Math.random() * 20000 + 5000,
      averageRoas: Math.random() * 4 + 1,
      dataPoints: [],
      dateRange: "LAST_30_DAYS" as const,
      lastUpdated: new Date().toISOString(),
    }));

    const totalImpressions = platformBreakdown.reduce(
      (sum, p) => sum + p.totalImpressions,
      0,
    );
    const totalClicks = platformBreakdown.reduce(
      (sum, p) => sum + p.totalClicks,
      0,
    );
    const totalCost = platformBreakdown.reduce(
      (sum, p) => sum + p.totalCost,
      0,
    );
    const totalConversions = platformBreakdown.reduce(
      (sum, p) => sum + p.totalConversions,
      0,
    );

    return {
      platforms,
      totalImpressions,
      totalClicks,
      totalCost,
      totalConversions,
      overallCtr: totalImpressions > 0 ? totalClicks / totalImpressions : 0,
      overallCpc: totalClicks > 0 ? totalCost / totalClicks : 0,
      overallCpm:
        totalImpressions > 0 ? (totalCost / totalImpressions) * 1000 : 0,
      overallConversionRate:
        totalClicks > 0 ? totalConversions / totalClicks : 0,
      overallCostPerConversion:
        totalConversions > 0 ? totalCost / totalConversions : 0,
      overallRoas: totalCost > 0 ? (totalConversions * 50000) / totalCost : 0,
      platformBreakdown,
      dateRange: "LAST_30_DAYS",
      lastUpdated: new Date().toISOString(),
    };
  }, []);

  // 데모 알림 생성
  const generateDemoAlerts = useCallback((): MetricsAlert[] => {
    return [
      {
        id: "alert_1",
        platform: "google_ads",
        accountId: "demo_account_1",
        campaignId: "demo_campaign_1",
        alertType: "performance_drop",
        severity: "critical",
        message: "Google Ads 캠페인 성과가 20% 감소했습니다.",
        threshold: { metric: "ctr", operator: "<", value: 0.02 },
        currentValue: 0.015,
        triggeredAt: new Date().toISOString(),
        acknowledged: false,
      },
      {
        id: "alert_2",
        platform: "meta_ads",
        accountId: "demo_account_2",
        campaignId: "demo_campaign_2",
        alertType: "budget_exceeded",
        severity: "warning",
        message: "Meta Ads 일일 예산이 초과되었습니다.",
        threshold: { metric: "cost", operator: ">", value: 100000 },
        currentValue: 120000,
        triggeredAt: new Date().toISOString(),
        acknowledged: false,
      },
      {
        id: "alert_3",
        platform: "tiktok_ads",
        accountId: "demo_account_3",
        campaignId: "demo_campaign_3",
        alertType: "conversion_spike",
        severity: "info",
        message: "TikTok Ads 전환수가 급증했습니다.",
        threshold: { metric: "conversions", operator: ">", value: 50 },
        currentValue: 85,
        triggeredAt: new Date().toISOString(),
        acknowledged: false,
      },
    ];
  }, []);

  // 데모 모드 토글
  const toggleDemoMode = useCallback(() => {
    setDemoMode(!demoMode);
    if (!demoMode) {
      // 데모 모드 활성화
      setMultiPlatformData(generateDemoData());
      setAlerts(generateDemoAlerts());
      setSelectedAccounts([
        { platform: "google_ads", accountId: "demo_account_1" },
        { platform: "meta_ads", accountId: "demo_account_2" },
        { platform: "tiktok_ads", accountId: "demo_account_3" },
        { platform: "amazon_ads", accountId: "demo_account_4" },
      ]);
    } else {
      // 데모 모드 비활성화
      setMultiPlatformData(null);
      setAlerts([]);
      setSelectedAccounts([]);
    }
  }, [demoMode, generateDemoData, generateDemoAlerts]);

  // 데이터 로드
  const loadData = useCallback(async () => {
    if (demoMode) {
      setMultiPlatformData(generateDemoData());

      return;
    }

    if (selectedAccounts.length === 0) {
      setError("선택된 계정이 없습니다.");

      return;
    }

    setLoading(true);
    setError(null);

    try {
      const enabledCredentials: Record<
        AdPlatform,
        Record<string, string>
      > = Object.entries(credentials)
        .filter(([_, config]) => config.enabled)
        .reduce(
          (acc, [platform, config]) => {
            acc[platform as AdPlatform] = config.credentials;

            return acc;
          },
          {} as Record<AdPlatform, Record<string, string>>,
        );

      const response = await fetchMultiPlatformMetrics(
        enabledCredentials as unknown as Parameters<
          typeof fetchMultiPlatformMetrics
        >[0],
        selectedAccounts,
      );

      if (response.success && response.data) {
        setMultiPlatformData(response.data as MultiPlatformMetrics);
      } else {
        setError(response.error || "데이터를 불러오는 중 오류가 발생했습니다.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }, [demoMode, selectedAccounts, credentials, generateDemoData]);

  // 실시간 업데이트
  useEffect(() => {
    if (realtimeEnabled && selectedAccounts.length > 0) {
      const interval = setInterval(() => {
        if (demoMode) {
          setMultiPlatformData(generateDemoData());
        } else {
          loadData();
        }
      }, 30000); // 30초마다 업데이트

      return () => clearInterval(interval);
    }
  }, [realtimeEnabled, selectedAccounts, demoMode, loadData, generateDemoData]);

  // 자격증명 업데이트
  const updateCredentials = useCallback(
    (platform: AdPlatform, field: string, value: string) => {
      setCredentials((prev) => ({
        ...prev,
        [platform]: {
          ...prev[platform],
          credentials: {
            ...prev[platform].credentials,
            [field]: value,
          },
        },
      }));
    },
    [],
  );

  // 플랫폼 토글
  const togglePlatform = useCallback((platform: AdPlatform) => {
    setCredentials((prev) => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        enabled: !prev[platform].enabled,
      },
    }));
  }, []);

  // 알림 확인
  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert,
      ),
    );
  }, []);

  // 내보내기
  const handleExport = useCallback(
    async (format: "csv" | "xlsx" | "json" | "pdf") => {
      if (!multiPlatformData) return;

      try {
        const response = await exportMetrics(multiPlatformData, format);

        if (response.success && response.data) {
          // 실제 구현에서는 다운로드 링크 제공
          alert(`내보내기 완료: ${response.data.filename}`);
        }
      } catch {
        alert("내보내기 실패");
      }
    },
    [multiPlatformData],
  );

  // Component에서 기대하는 시그니처에 맞는 래퍼 함수
  const handleDashboardExport = useCallback(
    (data: MultiPlatformMetrics, format: string) => {
      handleExport(format as "csv" | "xlsx" | "json" | "pdf");
    },
    [handleExport],
  );

  const handleChartExport = useCallback(
    (format: "pdf" | "svg" | "png" | "jpeg") => {
      // Chart export is different, convert to our supported formats
      const convertedFormat = format === "pdf" ? "pdf" : "png";

      handleExport(convertedFormat as "csv" | "xlsx" | "json" | "pdf");
    },
    [handleExport],
  );

  // 초기 데모 데이터 로드
  useEffect(() => {
    if (demoMode) {
      setMultiPlatformData(generateDemoData());
      setAlerts(generateDemoAlerts());
      setSelectedAccounts([
        { platform: "google_ads", accountId: "demo_account_1" },
        { platform: "meta_ads", accountId: "demo_account_2" },
        { platform: "tiktok_ads", accountId: "demo_account_3" },
        { platform: "amazon_ads", accountId: "demo_account_4" },
      ]);
    }
  }, [demoMode, generateDemoData, generateDemoAlerts]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">광고 성과 분석 시스템</h1>
          <p className="text-gray-600 mt-2">
            Google Ads, Meta Ads, TikTok Ads, Amazon Ads 등 다중 플랫폼 광고
            성과를 통합 분석
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Switch
            color="primary"
            isSelected={demoMode}
            onValueChange={toggleDemoMode}
          >
            데모 모드
          </Switch>
          <Badge color={demoMode ? "primary" : "default"} variant="flat">
            {demoMode ? "데모 데이터" : "실제 데이터"}
          </Badge>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <Card>
        <CardHeader>
          <Tabs
            selectedKey={selectedTab}
            onSelectionChange={(key) => setSelectedTab(key as string)}
          >
            <Tab key="setup" title="설정" />
            <Tab key="dashboard" title="대시보드" />
            <Tab key="comparison" title="플랫폼 비교" />
            <Tab key="individual" title="개별 분석" />
            <Tab key="alerts" title="알림" />
          </Tabs>
        </CardHeader>
        <CardBody>
          {/* 설정 탭 */}
          {selectedTab === "setup" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 플랫폼 상태 */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">플랫폼 상태</h3>
                  </CardHeader>
                  <CardBody>
                    <div className="space-y-4">
                      {Object.entries(credentials).map(([platform, config]) => (
                        <div
                          key={platform}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                config.enabled ? "bg-green-500" : "bg-gray-300"
                              }`}
                            />
                            <div>
                              <div className="font-medium">
                                {platform.replace("_", " ").toUpperCase()}
                              </div>
                              <div className="text-small text-gray-500">
                                {config.enabled ? "연결됨" : "비활성화"}
                              </div>
                            </div>
                          </div>
                          <Switch
                            isDisabled={!demoMode}
                            isSelected={config.enabled}
                            size="sm"
                            onValueChange={() =>
                              togglePlatform(platform as AdPlatform)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>

                {/* 계정 설정 */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">계정 설정</h3>
                  </CardHeader>
                  <CardBody>
                    <div className="space-y-4">
                      <div className="text-small text-gray-600">
                        {demoMode
                          ? "데모 모드에서는 샘플 계정이 자동으로 설정됩니다."
                          : "실제 계정 연결을 위해 API 자격증명을 입력하세요."}
                      </div>
                      <Button
                        isDisabled={demoMode}
                        startContent={<Settings className="w-4 h-4" />}
                        variant="light"
                        onClick={onCredentialsOpen}
                      >
                        자격증명 관리
                      </Button>
                      <div className="text-small text-gray-500">
                        선택된 계정: {selectedAccounts.length}개
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>

              {/* 컨트롤 */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">제어 패널</h3>
                </CardHeader>
                <CardBody>
                  <div className="flex items-center gap-4">
                    <Button
                      color="primary"
                      isLoading={loading}
                      startContent={<RefreshCw className="w-4 h-4" />}
                      onClick={loadData}
                    >
                      데이터 새로고침
                    </Button>
                    <Switch
                      isSelected={realtimeEnabled}
                      onValueChange={setRealtimeEnabled}
                    >
                      실시간 업데이트
                    </Switch>
                    <Button
                      isDisabled={!multiPlatformData}
                      startContent={<Database className="w-4 h-4" />}
                      variant="light"
                      onClick={() => handleExport("csv")}
                    >
                      내보내기
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}

          {/* 대시보드 탭 */}
          {selectedTab === "dashboard" && (
            <div>
              {multiPlatformData ? (
                <AdsPerformanceDashboard
                  accounts={selectedAccounts.map((acc) => ({
                    id: acc.accountId,
                    name: `Account ${acc.accountId}`,
                    platform: acc.platform,
                  }))}
                  alerts={alerts}
                  enableRealtime={realtimeEnabled}
                  initialData={multiPlatformData}
                  platforms={[
                    "google_ads",
                    "meta_ads",
                    "tiktok_ads",
                    "amazon_ads",
                  ]}
                  showAlerts={true}
                  onAlertAcknowledge={acknowledgeAlert}
                  onExport={handleDashboardExport}
                />
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <div className="text-lg font-semibold mb-2">
                    데이터가 없습니다
                  </div>
                  <div className="text-gray-600 mb-4">
                    {demoMode
                      ? "데모 모드를 활성화하거나"
                      : "플랫폼을 설정하고"}{" "}
                    데이터를 불러오세요.
                  </div>
                  <Button
                    color="primary"
                    isLoading={loading}
                    onClick={loadData}
                  >
                    데이터 로드
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* 플랫폼 비교 탭 */}
          {selectedTab === "comparison" && (
            <div>
              {multiPlatformData ? (
                <MultiPlatformChart
                  autoRefresh={realtimeEnabled}
                  chartType="bar"
                  data={multiPlatformData}
                  loading={loading}
                  showMetricsCards={true}
                  showPlatformComparison={true}
                  title="플랫폼별 성과 비교"
                  onExport={handleChartExport}
                  onRefresh={loadData}
                />
              ) : (
                <div className="text-center py-12">
                  <LineChart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <div className="text-lg font-semibold mb-2">
                    비교할 데이터가 없습니다
                  </div>
                  <div className="text-gray-600">
                    먼저 플랫폼 데이터를 불러와주세요.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 개별 분석 탭 */}
          {selectedTab === "individual" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {["google_ads", "meta_ads", "tiktok_ads", "amazon_ads"].map(
                  (platform) => (
                    <Card
                      key={platform}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <CardBody className="text-center">
                        <div className="text-2xl mb-2">
                          {platform === "google_ads"
                            ? "🔍"
                            : platform === "meta_ads"
                              ? "👥"
                              : platform === "tiktok_ads"
                                ? "🎵"
                                : "📦"}
                        </div>
                        <div className="font-medium">
                          {platform.replace("_", " ").toUpperCase()}
                        </div>
                        <div className="text-small text-gray-500">
                          {credentials[platform as AdPlatform].enabled
                            ? "활성"
                            : "비활성"}
                        </div>
                      </CardBody>
                    </Card>
                  ),
                )}
              </div>

              <div className="text-center py-8">
                <PieChart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <div className="text-lg font-semibold mb-2">
                  개별 플랫폼 분석
                </div>
                <div className="text-gray-600">
                  위의 플랫폼을 선택하여 상세 분석을 확인하세요.
                </div>
              </div>
            </div>
          )}

          {/* 알림 탭 */}
          {selectedTab === "alerts" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">성과 알림</h3>
                <Button
                  color="primary"
                  startContent={<AlertTriangle className="w-4 h-4" />}
                  onClick={onAlertOpen}
                >
                  알림 생성
                </Button>
              </div>

              {alerts.length > 0 ? (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <Card
                      key={alert.id}
                      className={`border-l-4 ${
                        alert.severity === "critical"
                          ? "border-red-500"
                          : alert.severity === "warning"
                            ? "border-yellow-500"
                            : "border-blue-500"
                      }`}
                    >
                      <CardBody>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-2 h-2 rounded-full mt-2 ${
                                alert.severity === "critical"
                                  ? "bg-red-500"
                                  : alert.severity === "warning"
                                    ? "bg-yellow-500"
                                    : "bg-blue-500"
                              }`}
                            />
                            <div>
                              <div className="font-medium">{alert.message}</div>
                              <div className="text-small text-gray-500 mt-1">
                                {alert.platform.replace("_", " ").toUpperCase()}{" "}
                                • {new Date(alert.triggeredAt).toLocaleString()}
                              </div>
                              <div className="text-small text-gray-500">
                                현재값: {alert.currentValue} | 임계값:{" "}
                                {alert.threshold.operator}{" "}
                                {alert.threshold.value}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {alert.acknowledged ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <Button
                                size="sm"
                                variant="light"
                                onClick={() => acknowledgeAlert(alert.id)}
                              >
                                확인
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
                  <div className="text-lg font-semibold mb-2">
                    알림이 없습니다
                  </div>
                  <div className="text-gray-600">
                    모든 캠페인이 정상적으로 운영되고 있습니다.
                  </div>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* 에러 표시 */}
      {error && (
        <Card className="border-red-500 border-l-4">
          <CardBody>
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-500" />
              <div>
                <div className="font-medium text-red-500">오류 발생</div>
                <div className="text-small text-gray-600">{error}</div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* 자격증명 모달 */}
      <Modal isOpen={isCredentialsOpen} size="2xl" onClose={onCredentialsClose}>
        <ModalContent>
          <ModalHeader>API 자격증명 관리</ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              {Object.entries(credentials).map(([platform, config]) => (
                <div key={platform}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">
                      {platform.replace("_", " ").toUpperCase()}
                    </h4>
                    <Switch
                      isSelected={config.enabled}
                      size="sm"
                      onValueChange={() =>
                        togglePlatform(platform as AdPlatform)
                      }
                    />
                  </div>

                  {config.enabled && (
                    <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                      {Object.entries(config.credentials).map(
                        ([field, value]) => (
                          <Input
                            key={field}
                            label={field
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, (str) => str.toUpperCase())}
                            placeholder={`${field} 입력`}
                            size="sm"
                            type={
                              field.includes("secret") ||
                              field.includes("token")
                                ? "password"
                                : "text"
                            }
                            value={value as string}
                            onChange={(e) =>
                              updateCredentials(
                                platform as AdPlatform,
                                field,
                                e.target.value,
                              )
                            }
                          />
                        ),
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onClick={onCredentialsClose}>
              취소
            </Button>
            <Button color="primary" onClick={onCredentialsClose}>
              저장
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 알림 생성 모달 */}
      <Modal isOpen={isAlertOpen} onClose={onAlertClose}>
        <ModalContent>
          <ModalHeader>알림 생성</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Select label="플랫폼" placeholder="플랫폼을 선택하세요">
                <SelectItem key="google_ads">Google Ads</SelectItem>
                <SelectItem key="meta_ads">Meta Ads</SelectItem>
                <SelectItem key="tiktok_ads">TikTok Ads</SelectItem>
                <SelectItem key="amazon_ads">Amazon Ads</SelectItem>
              </Select>

              <Select label="알림 유형" placeholder="알림 유형을 선택하세요">
                <SelectItem key="performance_drop">성과 하락</SelectItem>
                <SelectItem key="budget_exceeded">예산 초과</SelectItem>
                <SelectItem key="conversion_spike">전환 급증</SelectItem>
                <SelectItem key="cpc_increase">CPC 증가</SelectItem>
              </Select>

              <Input label="임계값" placeholder="알림 임계값" type="number" />

              <Input
                label="메시지"
                placeholder="알림 메시지를 입력하세요"
                type="text"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onClick={onAlertClose}>
              취소
            </Button>
            <Button color="primary" onClick={onAlertClose}>
              생성
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
