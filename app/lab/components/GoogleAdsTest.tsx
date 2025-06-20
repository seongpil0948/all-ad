"use client";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Divider } from "@heroui/divider";
import { Select, SelectItem } from "@heroui/select";
import { Snippet } from "@heroui/snippet";
import { Chip } from "@heroui/chip";
import { useIsSSR } from "@react-aria/ssr";

import PlatformTestCard from "./PlatformTestCard";
import GoogleAdsSetupGuide from "./GoogleAdsSetupGuide";

import log from "@/utils/logger";
import {
  GoogleAdsTestCredentials,
  GoogleAdsCampaign,
  generateAuthUrl,
  exchangeCodeForToken,
  fetchGoogleAdsAccounts,
  fetchCampaigns,
  updateCampaignStatus,
  fetchCampaignMetrics,
} from "@/app/lab/actions";

interface GoogleAdsAccount {
  id: string;
  name: string;
  currencyCode?: string;
  timeZone?: string;
  isManager?: boolean;
  isTestAccount?: boolean;
  isMCC?: boolean;
}

const STORAGE_KEY = "google-ads-test-credentials";

export default function GoogleAdsTest() {
  const [credentials, setCredentials] = useState<GoogleAdsTestCredentials>({
    clientId: "",
    clientSecret: "",
    developerToken: "",
    accessToken: "",
    refreshToken: "",
    loginCustomerId: "",
  });
  const isSSR = useIsSSR();

  const [authCode, setAuthCode] = useState("");
  const [accounts, setAccounts] = useState<GoogleAdsAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [campaigns, setCampaigns] = useState<GoogleAdsCampaign[]>([]);
  const [apiResponse, setApiResponse] = useState<{
    success?: boolean;
    authUrl?: string;
    [key: string]: unknown;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  interface TestItem {
    id: string;
    name: string;
    description: string;
    status: "pending" | "testing" | "success" | "error";
    error?: string;
  }

  const [testItems, setTestItems] = useState<TestItem[]>([
    {
      id: "token",
      name: "토큰 교환",
      description: "Authorization Code를 Refresh Token으로 교환",
      status: "pending",
    },
    {
      id: "accounts",
      name: "계정 목록 조회",
      description: "접근 가능한 Google Ads 계정 조회",
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

  // Load saved credentials from localStorage on mount
  useEffect(() => {
    if (!isSSR) {
      const savedCredentials = localStorage.getItem(STORAGE_KEY);

      if (savedCredentials) {
        try {
          const parsed = JSON.parse(savedCredentials);

          setCredentials((prev) => ({
            ...prev,
            ...parsed,
            refreshToken: parsed.refreshToken || prev.refreshToken,
            accessToken: parsed.accessToken || prev.accessToken,
          }));
        } catch (error) {
          log.error("Failed to parse saved credentials", error);
        }
      }
    }
  }, [isSSR]);

  // Save credentials to localStorage when they change
  useEffect(() => {
    if (!isSSR && credentials.clientId) {
      // Don't save sensitive tokens to localStorage, only configuration
      const toSave = {
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret,
        developerToken: credentials.developerToken,
        loginCustomerId: credentials.loginCustomerId,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    }
  }, [
    credentials.clientId,
    credentials.clientSecret,
    credentials.developerToken,
    credentials.loginCustomerId,
    isSSR,
  ]);

  // URL에서 OAuth 콜백 코드 확인
  useEffect(() => {
    if (!isSSR) {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const errorParam = urlParams.get("error");

      if (code) {
        setAuthCode(code);
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
      }

      if (errorParam) {
        setError(`OAuth 오류: ${errorParam}`);
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
      }
    }
  }, [isSSR]);

  // OAuth2 인증 URL 생성
  const handleGenerateAuthUrl = async () => {
    setError(null);

    // 필수 값 검증
    if (!credentials.clientId) {
      setError("Client ID를 입력해주세요");

      return;
    }

    try {
      const redirectUri = `${window.location.origin}/api/auth/callback/google-ads-lab`;
      const result = await generateAuthUrl(credentials.clientId, redirectUri);

      if (result.success && result.authUrl) {
        setApiResponse(result);
        // 새 창에서 OAuth 인증 시작
        const authWindow = window.open(
          result.authUrl,
          "_blank",
          "width=600,height=700",
        );

        // OAuth 창이 닫히면 authCode 확인
        const checkInterval = setInterval(() => {
          if (authWindow?.closed) {
            clearInterval(checkInterval);
            // URL params 다시 확인
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get("code");

            if (code) {
              setAuthCode(code);
            }
          }
        }, 1000);
      } else {
        setError(result.error || "인증 URL 생성 실패");
      }
    } catch (err) {
      setError("인증 URL 생성 중 오류 발생");
      log.error("Auth URL generation error", err);
    }
  };

  // 계정 목록 가져오기
  const handleFetchAccounts = async () => {
    setError(null);

    try {
      const result = await fetchGoogleAdsAccounts(credentials);

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

  // 토큰 교환
  const handleExchangeToken = async () => {
    if (!authCode) {
      setError("인증 코드가 없습니다");

      return;
    }

    if (!credentials.clientId || !credentials.clientSecret) {
      setError("Client ID와 Client Secret을 입력해주세요");

      return;
    }

    setError(null);
    setTestItems((prev) =>
      prev.map((item) =>
        item.id === "token" ? { ...item, status: "testing" as const } : item,
      ),
    );

    try {
      const result = await exchangeCodeForToken(
        authCode,
        credentials.clientId,
        credentials.clientSecret,
        `${window.location.origin}/api/auth/callback/google-ads-lab`,
      );

      if (result.success && result.refreshToken) {
        setCredentials((prev) => ({
          ...prev,
          refreshToken: result.refreshToken || "",
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

  // 캠페인 목록 조회
  const handleFetchCampaigns = async () => {
    if (!selectedAccountId) {
      setError("계정을 먼저 선택해주세요");

      return;
    }

    setError(null);

    try {
      const result = await fetchCampaigns(credentials, selectedAccountId);

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

  if (isSSR) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Google Ads API 설정</h2>
            <Button
              color="danger"
              size="sm"
              variant="light"
              onPress={() => {
                if (confirm("저장된 설정을 모두 삭제하시겠습니까?")) {
                  localStorage.removeItem(STORAGE_KEY);
                  setCredentials({
                    clientId: "",
                    clientSecret: "",
                    developerToken: "",
                    accessToken: "",
                    refreshToken: "",
                    loginCustomerId: "",
                  });
                  setAuthCode("");
                  setError(null);
                }
              }}
            >
              설정 초기화
            </Button>
          </div>

          <GoogleAdsSetupGuide />

          <Input
            label="Client ID"
            placeholder="1234567890-abc123.apps.googleusercontent.com"
            value={credentials.clientId}
            onChange={(e) =>
              setCredentials({ ...credentials, clientId: e.target.value })
            }
          />

          <Input
            label="Client Secret"
            placeholder="GOCSPX-..."
            type="password"
            value={credentials.clientSecret}
            onChange={(e) =>
              setCredentials({ ...credentials, clientSecret: e.target.value })
            }
          />

          <Input
            label="Developer Token"
            placeholder="Google Ads API Developer Token"
            value={credentials.developerToken}
            onChange={(e) =>
              setCredentials({ ...credentials, developerToken: e.target.value })
            }
          />

          <Input
            label="Login Customer ID (MCC)"
            placeholder="123-456-7890 (대시 없이)"
            value={credentials.loginCustomerId}
            onChange={(e) =>
              setCredentials({
                ...credentials,
                loginCustomerId: e.target.value,
              })
            }
          />

          <Divider />

          <h3 className="font-semibold">OAuth2 인증</h3>

          <Button
            color="primary"
            isDisabled={!credentials.clientId}
            onPress={handleGenerateAuthUrl}
          >
            1. OAuth2 인증 URL 생성
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
            label="Refresh Token"
            placeholder="자동으로 입력됩니다"
            value={credentials.refreshToken}
            onChange={(e) =>
              setCredentials({ ...credentials, refreshToken: e.target.value })
            }
          />

          {authCode && !credentials.refreshToken && (
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
        title="Google Ads API 연동 테스트"
        onRunTest={runTest}
      />

      <Card>
        <CardBody className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Google Ads 계정</h2>
            <Button
              color="primary"
              isDisabled={!credentials.refreshToken}
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
                {(account: GoogleAdsAccount) => (
                  <SelectItem key={account.id}>
                    <div className="flex items-center gap-2">
                      <span>
                        {account.name} ({account.id})
                      </span>
                      {account.isMCC && (
                        <Chip color="primary" size="sm" variant="flat">
                          MCC
                        </Chip>
                      )}
                      {account.isTestAccount && (
                        <Chip color="warning" size="sm" variant="flat">
                          테스트
                        </Chip>
                      )}
                      {account.isManager && !account.isMCC && (
                        <Chip color="secondary" size="sm" variant="flat">
                          관리자
                        </Chip>
                      )}
                    </div>
                  </SelectItem>
                )}
              </Select>
            </>
          )}
        </CardBody>
      </Card>

      {campaigns.length > 0 && (
        <Card>
          <CardBody className="space-y-4">
            <h3 className="text-lg font-semibold">캠페인 목록</h3>
            <div className="space-y-2">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-lg">{campaign.name}</p>
                      <p className="text-sm text-gray-600">ID: {campaign.id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-sm rounded ${
                          campaign.status === "ENABLED"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {campaign.status}
                      </span>
                      <Button
                        color={
                          campaign.status === "ENABLED" ? "danger" : "success"
                        }
                        size="sm"
                        variant="flat"
                        onPress={() => {
                          // 캠페인 ON/OFF 토글
                          const newStatus =
                            campaign.status === "ENABLED"
                              ? "PAUSED"
                              : "ENABLED";

                          updateCampaignStatus(
                            credentials,
                            selectedAccountId,
                            campaign.id,
                            newStatus,
                          )
                            .then((result) => {
                              if (result.success) {
                                setCampaigns((prev) =>
                                  prev.map((c) =>
                                    c.id === campaign.id
                                      ? { ...c, status: newStatus }
                                      : c,
                                  ),
                                );
                                log.info("Campaign status updated", {
                                  campaignId: campaign.id,
                                  newStatus,
                                });
                              } else {
                                setError(
                                  result.error || "캠페인 상태 변경 실패",
                                );
                              }
                            })
                            .catch((err) => {
                              setError("캠페인 상태 변경 중 오류 발생");
                              log.error("Campaign status update error", err);
                            });
                        }}
                      >
                        {campaign.status === "ENABLED" ? "일시정지" : "활성화"}
                      </Button>
                    </div>
                  </div>

                  {/* 캠페인 메트릭 표시 */}
                  {(campaign.impressions ||
                    campaign.clicks ||
                    campaign.costMicros) && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">노출수</p>
                        <p className="font-semibold">
                          {parseInt(
                            campaign.impressions || "0",
                          ).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">클릭수</p>
                        <p className="font-semibold">
                          {parseInt(campaign.clicks || "0").toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">비용</p>
                        <p className="font-semibold">
                          $
                          {(
                            parseInt(campaign.costMicros || "0") / 1000000
                          ).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">CTR</p>
                        <p className="font-semibold">
                          {parseFloat(campaign.ctr || "0").toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 상세 메트릭 보기 버튼 */}
                  <div className="mt-3 text-center">
                    <Button
                      size="sm"
                      variant="light"
                      onPress={async () => {
                        const result = await fetchCampaignMetrics(
                          credentials,
                          selectedAccountId,
                          campaign.id,
                          "LAST_7_DAYS",
                        );

                        if (result.success && result.metrics) {
                          setApiResponse({
                            campaignId: campaign.id,
                            campaignName: campaign.name,
                            metrics: result.metrics,
                          });
                        } else {
                          setError(result.error || "메트릭 조회 실패");
                        }
                      }}
                    >
                      일별 성과 보기
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {(error || apiResponse) && (
        <Card>
          <CardBody>
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                <p className="font-semibold">오류:</p>
                <p>{error}</p>
                {apiResponse && !apiResponse.success && (
                  <div className="mt-2">
                    <p className="text-sm">상세 정보:</p>
                    <pre className="text-xs overflow-auto mt-1">
                      {JSON.stringify(apiResponse, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {apiResponse &&
              "success" in apiResponse &&
              apiResponse.success === true &&
              "authUrl" in apiResponse &&
              typeof apiResponse.authUrl === "string" && (
                <div className="space-y-2">
                  <p className="font-semibold">응답 데이터:</p>
                  <Snippet color="primary">{apiResponse.authUrl}</Snippet>
                </div>
              )}

            {apiResponse && apiResponse.success && !error && (
              <div className="p-3 bg-green-100 text-green-700 rounded">
                <p className="font-semibold">성공!</p>
                {"refreshToken" in apiResponse && apiResponse.refreshToken ? (
                  <p className="text-sm mt-1">
                    Refresh Token이 성공적으로 획득되었습니다.
                  </p>
                ) : null}
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
