"use client";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Divider } from "@heroui/divider";
import { Code } from "@heroui/code";
import { Badge } from "@heroui/badge";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { Chip } from "@heroui/chip";

import PlatformTestCard from "./PlatformTestCard";

import log from "@/utils/logger";

interface TikTokCredentials {
  appId: string;
  appSecret: string;
  accessToken: string;
  refreshToken?: string;
  advertiserId?: string;
}

interface TestItem {
  id: string;
  name: string;
  description: string;
  status: "pending" | "testing" | "success" | "error";
  error?: string;
}

export default function TikTokAdsTest() {
  const [credentials, setCredentials] = useState<TikTokCredentials>({
    appId: "",
    appSecret: "",
    accessToken: "",
    refreshToken: "",
    advertiserId: "",
  });

  const [authCode, setAuthCode] = useState("");
  const [apiResponse, setApiResponse] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [testItems, setTestItems] = useState<TestItem[]>([
    {
      id: "auth",
      name: "인증 토큰 교환",
      description: "Authorization Code를 Access Token으로 교환",
      status: "pending",
    },
    {
      id: "advertiser",
      name: "광고주 정보",
      description: "광고주 계정 정보 조회",
      status: "pending",
    },
    {
      id: "campaigns",
      name: "캠페인 목록",
      description: "활성 캠페인 목록 조회",
      status: "pending",
    },
    {
      id: "performance",
      name: "성과 데이터",
      description: "캠페인 성과 지표 조회",
      status: "pending",
    },
  ]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const errorParam = urlParams.get("error");

    if (code) {
      setAuthCode(code);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (errorParam) {
      setError(`OAuth 오류: ${errorParam}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleGenerateAuthUrl = () => {
    const params = new URLSearchParams({
      client_key: credentials.appId,
      scope: "ads.management,ads.operation,reporting",
      response_type: "code",
      redirect_uri: `${window.location.origin}/api/auth/callback/tiktok-ads`,
      state: Math.random().toString(36).substring(7),
    });

    const authUrl = `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;

    window.open(authUrl, "_blank");
  };

  const runTest = async (testId: string) => {
    setTestItems((prev) =>
      prev.map((item) =>
        item.id === testId ? { ...item, status: "testing" } : item,
      ),
    );

    try {
      let result;

      switch (testId) {
        case "auth":
          result = await testTokenExchange();
          break;
        case "advertiser":
          result = await testAdvertiserInfo();
          break;
        case "campaigns":
          result = await testCampaigns();
          break;
        case "performance":
          result = await testPerformanceData();
          break;
      }

      setTestItems((prev) =>
        prev.map((item) =>
          item.id === testId
            ? { ...item, status: "success", error: undefined }
            : item,
        ),
      );

      if (result) {
        setApiResponse(result);
      }
    } catch (error) {
      setTestItems((prev) =>
        prev.map((item) =>
          item.id === testId
            ? {
                ...item,
                status: "error",
                error: error instanceof Error ? error.message : "테스트 실패",
              }
            : item,
        ),
      );

      setError(error instanceof Error ? error.message : "Unknown error");
      log.error(`Test ${testId} failed`, error);
    }
  };

  const testTokenExchange = async () => {
    if (!authCode) {
      throw new Error("Authorization Code가 필요합니다");
    }

    // 실제 API 호출 시뮬레이션
    const mockResponse = {
      code: 0,
      message: "OK",
      data: {
        access_token: "act.example123456789",
        advertiser_ids: ["7123456789012345"],
        scope: ["ads.management", "ads.operation", "reporting"],
        token_type: "Bearer",
        expires_in: 86400, // 24시간
      },
      request_id: "202501061234567890",
    };

    setCredentials((prev) => ({
      ...prev,
      accessToken: mockResponse.data.access_token,
      advertiserId: mockResponse.data.advertiser_ids[0],
    }));

    return mockResponse;
  };

  const testAdvertiserInfo = async () => {
    if (!credentials.advertiserId || !credentials.accessToken) {
      throw new Error("Advertiser ID와 Access Token이 필요합니다");
    }

    const mockData = {
      code: 0,
      message: "OK",
      data: {
        list: [
          {
            advertiser_id: credentials.advertiserId,
            advertiser_name: "Test Business",
            currency: "USD",
            timezone: "America/Los_Angeles",
            brand: "Test Brand",
            brand_id: "987654321",
            balance: 1000.0,
            status: "STATUS_ENABLE",
            create_time: "2025-01-01 00:00:00",
          },
        ],
        page_info: {
          page: 1,
          page_size: 10,
          total_number: 1,
          total_page: 1,
        },
      },
      request_id: "202501061234567891",
    };

    return mockData;
  };

  const testCampaigns = async () => {
    if (!credentials.advertiserId || !credentials.accessToken) {
      throw new Error("Advertiser ID와 Access Token이 필요합니다");
    }

    const mockData = {
      code: 0,
      message: "OK",
      data: {
        list: [
          {
            campaign_id: "1781234567890123456",
            campaign_name: "Summer Sale 2025",
            objective_type: "CONVERSIONS",
            budget: 500.0,
            budget_mode: "BUDGET_MODE_DAY",
            status: "CAMPAIGN_STATUS_ENABLE",
            operation_status: "ENABLE",
            create_time: "2025-01-05 10:00:00",
            modify_time: "2025-01-06 15:30:00",
            is_smart_performance_campaign: false,
          },
          {
            campaign_id: "1781234567890123457",
            campaign_name: "New Year Promo",
            objective_type: "TRAFFIC",
            budget: 250.0,
            budget_mode: "BUDGET_MODE_TOTAL",
            status: "CAMPAIGN_STATUS_DISABLE",
            operation_status: "DISABLE",
            create_time: "2025-01-01 08:00:00",
            modify_time: "2025-01-04 12:00:00",
            is_smart_performance_campaign: true,
          },
        ],
        page_info: {
          page: 1,
          page_size: 100,
          total_number: 2,
          total_page: 1,
        },
      },
      request_id: "202501061234567892",
    };

    return mockData;
  };

  const testPerformanceData = async () => {
    if (!credentials.advertiserId || !credentials.accessToken) {
      throw new Error("Advertiser ID와 Access Token이 필요합니다");
    }

    const mockData = {
      code: 0,
      message: "OK",
      data: {
        list: [
          {
            dimensions: {
              campaign_id: "1781234567890123456",
              stat_time_day: "2025-01-06",
            },
            metrics: {
              spend: "125.50",
              impressions: "15420",
              clicks: "342",
              ctr: "2.22",
              cpc: "0.37",
              cpm: "8.14",
              conversions: "28",
              conversion_rate: "8.19",
              cost_per_conversion: "4.48",
              video_watched_2s: "8210",
              video_watched_6s: "5123",
              engaged_view: "3421",
            },
          },
          {
            dimensions: {
              campaign_id: "1781234567890123457",
              stat_time_day: "2025-01-06",
            },
            metrics: {
              spend: "89.25",
              impressions: "12100",
              clicks: "425",
              ctr: "3.51",
              cpc: "0.21",
              cpm: "7.38",
              conversions: "12",
              conversion_rate: "2.82",
              cost_per_conversion: "7.44",
              video_watched_2s: "6543",
              video_watched_6s: "4231",
              engaged_view: "2876",
            },
          },
        ],
        page_info: {
          page: 1,
          page_size: 1000,
          total_number: 2,
          total_page: 1,
        },
      },
      request_id: "202501061234567893",
    };

    return mockData;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">TikTok Ads API 설정</h2>
            <Chip color="warning" size="sm" variant="flat">
              Beta
            </Chip>
          </div>

          <Accordion defaultExpandedKeys={["guide"]}>
            <AccordionItem
              key="guide"
              aria-label="설정 가이드"
              title={
                <div className="flex items-center gap-2">
                  <span>📋</span>
                  <span className="font-medium">빠른 시작 가이드</span>
                </div>
              }
            >
              <div className="space-y-4 pb-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">
                    1. TikTok 개발자 계정 설정
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                    <li>
                      <a
                        className="text-blue-600 hover:underline"
                        href="https://developers.tiktok.com"
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        TikTok Developers
                      </a>
                      에서 계정 생성
                    </li>
                    <li>Business API 액세스 신청 (승인까지 2-7일 소요)</li>
                    <li>앱 생성 후 App ID와 App Secret 발급</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">2. OAuth 2.0 인증</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                    <li>Authorization Code 방식 사용</li>
                    <li>필수 권한: ads.management, reporting</li>
                    <li>Access Token 유효기간: 24시간</li>
                    <li>Refresh Token 유효기간: 365일</li>
                  </ul>
                </div>

                <Card className="bg-yellow-50 border-yellow-200">
                  <CardBody className="text-sm">
                    <p className="font-semibold text-yellow-800 mb-1">
                      ⚠️ 중요 제한사항
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-yellow-700">
                      <li>웹훅은 광고 이벤트를 지원하지 않음</li>
                      <li>캠페인 모니터링은 폴링 방식 필요</li>
                      <li>API 호출 제한: 600회/분</li>
                    </ul>
                  </CardBody>
                </Card>
              </div>
            </AccordionItem>

            <AccordionItem
              key="troubleshooting"
              aria-label="트러블슈팅"
              title={
                <div className="flex items-center gap-2">
                  <span>🔧</span>
                  <span className="font-medium">트러블슈팅 가이드</span>
                </div>
              }
            >
              <div className="space-y-4 pb-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">
                    흔한 오류와 해결방법
                  </h4>

                  <Card className="bg-gray-50">
                    <CardBody className="space-y-2">
                      <p className="font-medium text-sm">
                        1. &quot;40001: Invalid auth_code&quot;
                      </p>
                      <p className="text-sm text-gray-600">
                        Authorization Code는 한 번만 사용 가능합니다. 새로운
                        코드를 받아서 다시 시도하세요.
                      </p>
                    </CardBody>
                  </Card>

                  <Card className="bg-gray-50">
                    <CardBody className="space-y-2">
                      <p className="font-medium text-sm">
                        2. &quot;40002: Invalid access_token&quot;
                      </p>
                      <p className="text-sm text-gray-600">
                        토큰이 만료되었거나 잘못되었습니다. 24시간마다 토큰을
                        갱신해야 합니다.
                      </p>
                    </CardBody>
                  </Card>

                  <Card className="bg-gray-50">
                    <CardBody className="space-y-2">
                      <p className="font-medium text-sm">
                        3. &quot;40104: App permissions insufficient&quot;
                      </p>
                      <p className="text-sm text-gray-600">
                        앱에 필요한 권한이 없습니다. Business API 승인 상태를
                        확인하세요.
                      </p>
                    </CardBody>
                  </Card>

                  <Card className="bg-gray-50">
                    <CardBody className="space-y-2">
                      <p className="font-medium text-sm">
                        4. 429 Rate Limit Error
                      </p>
                      <p className="text-sm text-gray-600">
                        API 호출 제한을 초과했습니다. 지수 백오프로
                        재시도하세요.
                      </p>
                    </CardBody>
                  </Card>
                </div>

                <Divider />

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">디버깅 팁</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    <li>
                      모든 API 응답의 <Code size="sm">request_id</Code>를
                      로깅하여 지원 요청 시 사용
                    </li>
                    <li>Sandbox 환경에서 먼저 테스트 진행</li>
                    <li>Business Center 계정으로 여러 광고주 관리 가능</li>
                  </ul>
                </div>
              </div>
            </AccordionItem>

            <AccordionItem
              key="api-reference"
              aria-label="API 레퍼런스"
              title={
                <div className="flex items-center gap-2">
                  <span>📚</span>
                  <span className="font-medium">주요 API 엔드포인트</span>
                </div>
              }
            >
              <div className="space-y-4 pb-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">인증 관련</h4>
                  <Code className="block p-2" size="sm">
                    POST
                    https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/
                  </Code>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">캠페인 관리</h4>
                  <div className="space-y-1">
                    <Code className="block p-2" size="sm">
                      POST /open_api/v1.3/campaign/create/
                    </Code>
                    <Code className="block p-2" size="sm">
                      POST /open_api/v1.3/campaign/update/status/
                    </Code>
                    <Code className="block p-2" size="sm">
                      GET /open_api/v1.3/campaign/get/
                    </Code>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">보고서 조회</h4>
                  <div className="space-y-1">
                    <Code className="block p-2" size="sm">
                      GET /open_api/v1.3/report/integrated/get/
                    </Code>
                    <Code className="block p-2" size="sm">
                      POST /open_api/v1.3/report/task/create/
                    </Code>
                  </div>
                </div>

                <div className="mt-4">
                  <a
                    className="text-blue-600 hover:underline text-sm"
                    href="https://business-api.tiktok.com/portal/docs"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    전체 API 문서 보기 →
                  </a>
                </div>
              </div>
            </AccordionItem>
          </Accordion>

          <Input
            label="App ID"
            placeholder="TikTok App ID"
            value={credentials.appId}
            onChange={(e) =>
              setCredentials({ ...credentials, appId: e.target.value })
            }
          />

          <Input
            label="App Secret"
            placeholder="TikTok App Secret"
            type="password"
            value={credentials.appSecret}
            onChange={(e) =>
              setCredentials({ ...credentials, appSecret: e.target.value })
            }
          />

          <Divider />

          <h3 className="font-semibold">OAuth2 인증</h3>

          <Button
            color="primary"
            isDisabled={!credentials.appId}
            onPress={handleGenerateAuthUrl}
          >
            TikTok OAuth 시작
          </Button>

          <Input
            label="Authorization Code"
            placeholder="OAuth 인증 후 자동 입력됩니다"
            value={authCode}
            onChange={(e) => setAuthCode(e.target.value)}
          />

          <Input
            label="Advertiser ID"
            placeholder="광고주 ID"
            value={credentials.advertiserId}
            onChange={(e) =>
              setCredentials({ ...credentials, advertiserId: e.target.value })
            }
          />
        </CardBody>
      </Card>

      <PlatformTestCard
        testItems={testItems}
        title="TikTok Ads API 연동 테스트"
        onRunTest={runTest}
      />

      <Card>
        <CardBody className="space-y-3">
          <h3 className="font-semibold">API 속도 제한</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>일반 엔드포인트</span>
              <Badge color="primary" variant="flat">
                600/분
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>맞춤 오디언스</span>
              <Badge color="warning" variant="flat">
                24회/일
              </Badge>
            </div>
          </div>
        </CardBody>
      </Card>

      {(error || apiResponse) && (
        <Card>
          <CardBody>
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                <p className="font-semibold">오류:</p>
                <p>{error}</p>
              </div>
            )}

            {apiResponse && (
              <div className="space-y-2">
                <p className="font-semibold">응답 데이터:</p>
                <Code className="w-full p-4 overflow-auto max-h-96">
                  <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
                </Code>
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
