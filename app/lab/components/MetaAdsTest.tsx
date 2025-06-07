"use client";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Divider } from "@heroui/divider";
import { Code } from "@heroui/code";
import { Snippet } from "@heroui/snippet";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { Switch } from "@heroui/switch";

import PlatformTestCard from "./PlatformTestCard";
import MetaAdsSetupGuide from "./MetaAdsSetupGuide";

import log from "@/utils/logger";
import {
  MetaAdsTestCredentials,
  exchangeMetaToken,
  fetchMetaAdsAccounts,
  fetchMetaCampaigns,
  updateMetaCampaignStatus,
  batchUpdateMetaCampaignStatus,
  clearMetaCache,
} from "@/app/lab/actions";
import {
  generateMetaAuthUrl,
  getMetaRedirectUri,
  META_DEFAULT_SCOPES,
} from "@/lib/oauth/meta-oauth-helper";

interface MetaAdAccount {
  id: string;
  name: string;
  status: number;
  currency: string;
  timezone: string;
}

interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective?: string;
  dailyBudget?: number;
  lifetimeBudget?: number;
}

interface TestItem {
  id: string;
  name: string;
  description: string;
  status: "pending" | "testing" | "success" | "error";
  error?: string;
}

export default function MetaAdsTest() {
  const [credentials, setCredentials] = useState<MetaAdsTestCredentials>({
    appId: "1225707049222640",
    appSecret: "05181cc437c787e18b8b8059e4dcfeb9",
    accessToken: "",
    businessId: "1081449880552906",
  });

  const [authCode, setAuthCode] = useState("");
  const [accounts, setAccounts] = useState<MetaAdAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [campaigns, setCampaigns] = useState<MetaCampaign[]>([]);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(
    new Set(),
  );
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [cacheEnabled, setCacheEnabled] = useState(true);

  const [testItems, setTestItems] = useState<TestItem[]>([
    {
      id: "token",
      name: "토큰 교환",
      description: "Authorization Code를 Access Token으로 교환",
      status: "pending",
    },
    {
      id: "accounts",
      name: "광고 계정 목록",
      description: "접근 가능한 광고 계정 조회",
      status: "pending",
    },
    {
      id: "campaigns",
      name: "캠페인 목록 조회",
      description: "선택된 계정의 캠페인 목록 조회",
      status: "pending",
    },
    {
      id: "campaign-toggle",
      name: "캠페인 ON/OFF",
      description: "캠페인 상태 변경 테스트",
      status: "pending",
    },
  ]);

  // URL에서 OAuth 콜백 코드 확인
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

  // OAuth2 인증 URL 생성
  const handleGenerateAuthUrl = async () => {
    setError(null);
    try {
      const redirectUri = getMetaRedirectUri(true); // true for lab environment
      const authUrl = generateMetaAuthUrl({
        appId: credentials.appId,
        redirectUri,
        scope: META_DEFAULT_SCOPES,
      });

      setApiResponse({
        success: true,
        authUrl,
        redirectUri,
        note: "Facebook App 설정에서 이 Redirect URI가 등록되어 있는지 확인하세요.",
      });
      window.open(authUrl, "_blank");
    } catch (err) {
      setError("인증 URL 생성 중 오류 발생");
      log.error("Auth URL generation error", err);
    }
  };

  // 토큰 교환
  const handleExchangeToken = async () => {
    if (!authCode) {
      setError("인증 코드가 없습니다");

      return;
    }

    setError(null);

    try {
      const result = await exchangeMetaToken(
        authCode,
        credentials.appId,
        credentials.appSecret,
        getMetaRedirectUri(true), // Use the same redirect URI
      );

      if (result.success && result.accessToken) {
        setCredentials((prev) => ({
          ...prev,
          accessToken: result.accessToken || "",
        }));
        setApiResponse(result);
        setTestItems((prev) =>
          prev.map((item) =>
            item.id === "token"
              ? { ...item, status: "success" as const }
              : item,
          ),
        );
      } else {
        setError(result.error || "토큰 교환 실패");
        setTestItems((prev) =>
          prev.map((item) =>
            item.id === "token"
              ? { ...item, status: "error" as const, error: result.error }
              : item,
          ),
        );
      }
    } catch (err) {
      setError("토큰 교환 중 오류 발생");
      log.error("Token exchange error", err);
    }
  };

  // 계정 목록 가져오기
  const handleFetchAccounts = async () => {
    setError(null);

    try {
      const result = await fetchMetaAdsAccounts(credentials);

      if (result.success && result.accounts) {
        setAccounts(result.accounts);
        setApiResponse(result);
        setTestItems((prev) =>
          prev.map((item) =>
            item.id === "accounts"
              ? { ...item, status: "success" as const }
              : item,
          ),
        );
      } else {
        setError(result.error || "계정 목록 조회 실패");
        setApiResponse(result);
        setTestItems((prev) =>
          prev.map((item) =>
            item.id === "accounts"
              ? { ...item, status: "error" as const, error: result.error }
              : item,
          ),
        );
      }
    } catch (err) {
      setError("계정 목록 조회 중 오류 발생");
      log.error("Fetch accounts error", err);
    }
  };

  // 캠페인 목록 조회
  const handleFetchCampaigns = async () => {
    if (!selectedAccountId) {
      setError("계정을 먼저 선택해주세요");

      return;
    }

    setError(null);

    try {
      const result = await fetchMetaCampaigns(credentials, selectedAccountId);

      if (result.success && result.campaigns) {
        setCampaigns(result.campaigns);
        setApiResponse(result);
        setTestItems((prev) =>
          prev.map((item) =>
            item.id === "campaigns"
              ? { ...item, status: "success" as const }
              : item,
          ),
        );
      } else {
        setError(result.error || "캠페인 목록 조회 실패");
        setTestItems((prev) =>
          prev.map((item) =>
            item.id === "campaigns"
              ? { ...item, status: "error" as const, error: result.error }
              : item,
          ),
        );
      }
    } catch (err) {
      setError("캠페인 목록 조회 중 오류 발생");
      log.error("Fetch campaigns error", err);
    }
  };

  // 테스트 실행
  const runTest = async (testId: string) => {
    setTestItems((prev) =>
      prev.map((item) =>
        item.id === testId ? { ...item, status: "testing" as const } : item,
      ),
    );

    switch (testId) {
      case "token":
        await handleExchangeToken();
        break;
      case "accounts":
        await handleFetchAccounts();
        break;
      case "campaigns":
        await handleFetchCampaigns();
        break;
      case "campaign-toggle":
        // 캠페인 ON/OFF 테스트 구현 예정
        setError("캠페인 ON/OFF 기능은 구현 예정입니다");
        setTestItems((prev) =>
          prev.map((item) =>
            item.id === testId
              ? { ...item, status: "error" as const, error: "구현 예정" }
              : item,
          ),
        );
        break;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="space-y-4">
          <h2 className="text-xl font-semibold">Meta Ads API 설정</h2>

          <MetaAdsSetupGuide />

          <Card className="bg-blue-50 border-blue-200">
            <CardBody className="text-sm space-y-2">
              <h3 className="font-semibold">📋 설정 가이드</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Meta for Developers에서 앱 생성</li>
                <li>Business Manager에서 System User 생성</li>
                <li>
                  필요한 권한: ads_management, ads_read, business_management
                </li>
                <li>App Review 후 Advanced Access 필요</li>
                <li>Marketing API v23.0 사용</li>
              </ul>
              <Divider />
              <div className="mt-2">
                <p className="font-semibold text-orange-600">⚠️ 중요 사항</p>
                <ul className="list-disc list-inside mt-1 space-y-1 text-gray-600">
                  <li>System User Token 사용 권장 (무기한 유효)</li>
                  <li>일반 User Token은 최대 60일 유효</li>
                  <li>Rate Limit: 시간당 200회 + 활성 광고당 5회</li>
                  <li>한국 개인정보보호법(PIPA) 준수 필요</li>
                </ul>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardBody className="text-sm space-y-2">
              <h3 className="font-semibold">🚀 SDK 개선 사항</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>✅ Facebook Business SDK 공식 패키지 사용</li>
                <li>✅ App Secret Proof 보안 구현</li>
                <li>✅ Redis 기반 24시간 캐싱 (문서 권장사항)</li>
                <li>✅ 커서 기반 페이지네이션 구현</li>
                <li>✅ 배치 API로 최대 50개 동시 처리</li>
                <li>✅ SDK Field 열거형 사용 (타입 안전성)</li>
                <li>✅ 디버그 모드 자동 설정 (개발 환경)</li>
              </ul>
            </CardBody>
          </Card>

          <Input
            label="App ID"
            placeholder="Meta App ID"
            value={credentials.appId}
            onChange={(e) =>
              setCredentials({ ...credentials, appId: e.target.value })
            }
          />

          <Input
            label="App Secret"
            placeholder="Meta App Secret"
            type="password"
            value={credentials.appSecret}
            onChange={(e) =>
              setCredentials({ ...credentials, appSecret: e.target.value })
            }
          />

          <Input
            label="Business ID (Optional)"
            placeholder="Business Portfolio ID"
            value={credentials.businessId}
            onChange={(e) =>
              setCredentials({ ...credentials, businessId: e.target.value })
            }
          />

          <Divider />

          <h3 className="font-semibold">OAuth2 인증</h3>

          <Button
            color="primary"
            isDisabled={!credentials.appId}
            onPress={handleGenerateAuthUrl}
          >
            1. Facebook Login 시작
          </Button>

          <Input
            description={
              authCode
                ? "✅ 인증 코드가 자동으로 입력되었습니다"
                : "OAuth 인증 후 자동으로 입력됩니다"
            }
            label="Authorization Code"
            placeholder="인증 후 받은 코드를 입력하세요"
            value={authCode}
            onChange={(e) => setAuthCode(e.target.value)}
          />

          <Input
            label="Access Token"
            placeholder="자동으로 입력됩니다"
            value={credentials.accessToken}
            onChange={(e) =>
              setCredentials({ ...credentials, accessToken: e.target.value })
            }
          />

          {authCode && !credentials.accessToken && (
            <Button
              color="primary"
              variant="flat"
              onPress={handleExchangeToken}
            >
              토큰 교환하기
            </Button>
          )}
        </CardBody>
      </Card>

      <PlatformTestCard
        testItems={testItems}
        title="Meta Ads API 연동 테스트"
        onRunTest={runTest}
      />

      <Card>
        <CardBody className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Meta Ads 계정</h2>
            <Button
              color="primary"
              isDisabled={!credentials.accessToken}
              onPress={handleFetchAccounts}
            >
              계정 목록 가져오기
            </Button>
          </div>

          {accounts.length > 0 && (
            <>
              <Select
                items={accounts}
                label="테스트할 계정 선택"
                placeholder="계정을 선택하세요"
                selectedKeys={selectedAccountId ? [selectedAccountId] : []}
                onChange={(e) => setSelectedAccountId(e.target.value)}
              >
                {(account: MetaAdAccount) => (
                  <SelectItem key={account.id}>
                    <div className="flex items-center gap-2">
                      <span>
                        {account.name} ({account.id})
                      </span>
                      <Chip
                        color={account.status === 1 ? "success" : "danger"}
                        size="sm"
                        variant="flat"
                      >
                        {account.status === 1 ? "활성" : "비활성"}
                      </Chip>
                    </div>
                  </SelectItem>
                )}
              </Select>

              {selectedAccountId && (
                <Button
                  color="primary"
                  variant="flat"
                  onPress={handleFetchCampaigns}
                >
                  캠페인 목록 조회
                </Button>
              )}
            </>
          )}
        </CardBody>
      </Card>

      {campaigns.length > 0 && (
        <Card>
          <CardBody className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">캠페인 목록</h3>
              <div className="flex gap-2">
                <Switch
                  isSelected={cacheEnabled}
                  size="sm"
                  onValueChange={setCacheEnabled}
                >
                  캐시 사용
                </Switch>
                <Button
                  color="warning"
                  size="sm"
                  variant="flat"
                  onPress={async () => {
                    const result = await clearMetaCache();

                    if (result.success) {
                      setApiResponse({ message: "캐시가 초기화되었습니다" });
                    } else {
                      setError(result.error || "캐시 초기화 실패");
                    }
                  }}
                >
                  캐시 초기화
                </Button>
              </div>
            </div>

            {selectedCampaigns.size > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg flex justify-between items-center">
                <span>{selectedCampaigns.size}개 캠페인 선택됨</span>
                <div className="flex gap-2">
                  <Button
                    color="success"
                    isLoading={batchProcessing}
                    size="sm"
                    variant="flat"
                    onPress={async () => {
                      setBatchProcessing(true);
                      const updates = Array.from(selectedCampaigns).map(
                        (id) => ({
                          campaignId: id,
                          status: "ACTIVE" as const,
                        }),
                      );

                      const result = await batchUpdateMetaCampaignStatus(
                        credentials,
                        updates,
                      );

                      if (result.success) {
                        setCampaigns((prev) =>
                          prev.map((c) =>
                            selectedCampaigns.has(c.id)
                              ? { ...c, status: "ACTIVE" }
                              : c,
                          ),
                        );
                        setSelectedCampaigns(new Set());
                        setApiResponse(result.results);
                      } else {
                        setError(result.error || "배치 처리 실패");
                      }
                      setBatchProcessing(false);
                    }}
                  >
                    모두 활성화
                  </Button>
                  <Button
                    color="danger"
                    isLoading={batchProcessing}
                    size="sm"
                    variant="flat"
                    onPress={async () => {
                      setBatchProcessing(true);
                      const updates = Array.from(selectedCampaigns).map(
                        (id) => ({
                          campaignId: id,
                          status: "PAUSED" as const,
                        }),
                      );

                      const result = await batchUpdateMetaCampaignStatus(
                        credentials,
                        updates,
                      );

                      if (result.success) {
                        setCampaigns((prev) =>
                          prev.map((c) =>
                            selectedCampaigns.has(c.id)
                              ? { ...c, status: "PAUSED" }
                              : c,
                          ),
                        );
                        setSelectedCampaigns(new Set());
                        setApiResponse(result.results);
                      } else {
                        setError(result.error || "배치 처리 실패");
                      }
                      setBatchProcessing(false);
                    }}
                  >
                    모두 일시정지
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setSelectedCampaigns((prev) => {
                      const newSet = new Set(prev);

                      if (newSet.has(campaign.id)) {
                        newSet.delete(campaign.id);
                      } else {
                        newSet.add(campaign.id);
                      }

                      return newSet;
                    });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedCampaigns((prev) => {
                        const newSet = new Set(prev);

                        if (newSet.has(campaign.id)) {
                          newSet.delete(campaign.id);
                        } else {
                          newSet.add(campaign.id);
                        }

                        return newSet;
                      });
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <input
                      checked={selectedCampaigns.has(campaign.id)}
                      className="w-4 h-4"
                      type="checkbox"
                      onChange={() => {}}
                    />
                    <div>
                      <p className="font-medium">{campaign.name}</p>
                      <p className="text-sm text-gray-600">
                        ID: {campaign.id} | 목표: {campaign.objective}
                      </p>
                      {campaign.dailyBudget && (
                        <p className="text-sm text-gray-600">
                          일일 예산: ${campaign.dailyBudget}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-sm rounded ${
                        campaign.status === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {campaign.status}
                    </span>
                    <Button
                      color={
                        campaign.status === "ACTIVE" ? "danger" : "success"
                      }
                      size="sm"
                      variant="flat"
                      onPress={async () => {
                        const newStatus =
                          campaign.status === "ACTIVE" ? "PAUSED" : "ACTIVE";

                        const result = await updateMetaCampaignStatus(
                          credentials,
                          campaign.id,
                          newStatus,
                        );

                        if (result.success) {
                          setCampaigns((prev) =>
                            prev.map((c) =>
                              c.id === campaign.id
                                ? { ...c, status: newStatus }
                                : c,
                            ),
                          );
                        } else {
                          setError(result.error || "캠페인 상태 변경 실패");
                        }
                      }}
                    >
                      {campaign.status === "ACTIVE" ? "일시정지" : "활성화"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody className="space-y-3">
          <h3 className="font-semibold">빠른 참조</h3>
          <Snippet size="sm" symbol="📍">
            Graph API Explorer: developers.facebook.com/tools/explorer
          </Snippet>
          <Snippet size="sm" symbol="📍">
            Business Manager: business.facebook.com
          </Snippet>
          <Snippet size="sm" symbol="📍">
            Marketing API Docs: developers.facebook.com/docs/marketing-apis
          </Snippet>
        </CardBody>
      </Card>

      {(error || apiResponse) && (
        <Card>
          <CardBody>
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                <p className="font-semibold">오류:</p>
                <p>{error}</p>
                <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
              </div>
            )}

            {apiResponse && apiResponse.success === true && (
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
