"use client";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Divider } from "@heroui/divider";
import { Code } from "@heroui/code";
import { Select, SelectItem } from "@heroui/select";
import { Snippet } from "@heroui/snippet";
import { useIsSSR } from "@react-aria/ssr";

import PlatformTestCard from "./PlatformTestCard";

import log from "@/utils/logger";
import {
  GoogleAdsTestCredentials,
  GoogleAdsCampaign,
  generateAuthUrl,
  exchangeCodeForToken,
  fetchGoogleAdsAccounts,
  fetchCampaigns,
  updateCampaignStatus,
} from "@/app/lab/actions";

interface GoogleAdsAccount {
  id: string;
  name: string;
  currencyCode?: string;
  timeZone?: string;
  isManager?: boolean;
}

export default function GoogleAdsTest() {
  const [credentials, setCredentials] = useState<GoogleAdsTestCredentials>({
    clientId:
      "1047362900010-d8heiq7g4sq3rm3qjr6uqagsri8cuep5.apps.googleusercontent.com",
    clientSecret: "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",
    developerToken: "h0lsJQWr8PuCrme3dGeTgw",
    accessToken: "",
    refreshToken: "",
    loginCustomerId: "2616098766", // MCC 관리자 계정 (대시 없이)
  });
  const isSSR = useIsSSR();

  const [authCode, setAuthCode] = useState("");
  const [accounts, setAccounts] = useState<GoogleAdsAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [campaigns, setCampaigns] = useState<GoogleAdsCampaign[]>([]);
  const [apiResponse, setApiResponse] = useState<any>(null);
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
      const redirectUri = `${window.location.origin}/api/auth/callback/google-ads-lab`;
      const result = await generateAuthUrl(credentials.clientId, redirectUri);

      if (result.success) {
        setApiResponse(result);
        window.open(result.authUrl, "_blank");
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
              : item
          )
        );
      } else {
        setError(result.error || "계정 목록 조회 실패");
        setApiResponse(result);
        setTestItems((prev) =>
          prev.map((item) =>
            item.id === "accounts"
              ? { ...item, status: "error" as const, error: result.error }
              : item
          )
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

    setError(null);

    try {
      const result = await exchangeCodeForToken(
        authCode,
        credentials.clientId,
        credentials.clientSecret,
        `${window.location.origin}/api/auth/callback/google-ads-lab`
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
            item.id === "token" ? { ...item, status: "success" as const } : item
          )
        );
      } else {
        setError(result.error || "토큰 교환 실패");
        setTestItems((prev) =>
          prev.map((item) =>
            item.id === "token"
              ? { ...item, status: "error" as const, error: result.error }
              : item
          )
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
              : item
          )
        );
      } else {
        setError(result.error || "캠페인 목록 조회 실패");
        setTestItems((prev) =>
          prev.map((item) =>
            item.id === "campaigns"
              ? { ...item, status: "error" as const, error: result.error }
              : item
          )
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
        item.id === testId ? { ...item, status: "testing" as const } : item
      )
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
              : item
          )
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
          <h2 className="text-xl font-semibold">Google Ads API 설정</h2>

          <Card className="bg-blue-50 border-blue-200">
            <CardBody className="text-sm">
              <h3 className="font-semibold mb-2">
                ⚠️ 일반적인 오류 해결 가이드
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-red-600">
                    PERMISSION_DENIED: Google Ads API has not been used
                  </p>
                  <p className="text-gray-700">
                    Google Ads API를 활성화해야 합니다:
                  </p>
                  <ol className="list-decimal list-inside mt-1 space-y-1 text-gray-600">
                    <li>
                      <a
                        className="text-blue-600 hover:underline"
                        href="https://console.developers.google.com/apis/api/googleads.googleapis.com/overview?project=1047362900010"
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        Google Cloud Console에서 API 활성화 (프로젝트:
                        1047362900010)
                      </a>
                    </li>
                    <li>&quot;사용&quot; 버튼을 클릭하여 API 활성화</li>
                    <li>
                      Developer Token이 승인되었는지 확인 (Basic/Standard
                      Access)
                    </li>
                    <li>활성화 후 2-3분 대기 필요</li>
                  </ol>
                </div>
                <Divider />
                <div>
                  <p className="font-semibold text-red-600">
                    redirect_uri_mismatch 오류
                  </p>
                  <p className="text-gray-700">
                    OAuth 2.0 클라이언트에 리디렉션 URI 추가:
                  </p>
                  <Code className="mt-1 text-xs">
                    {`${window.location.origin}/api/auth/callback/google-ads-lab`}
                  </Code>
                </div>
                <Divider />
                <div>
                  <p className="font-semibold text-orange-600">
                    Developer Token 관련
                  </p>
                  <ul className="list-disc list-inside mt-1 space-y-1 text-gray-600">
                    <li>Test Account에서는 테스트 토큰 사용 가능</li>
                    <li>Production 사용 시 Basic Access 이상 필요</li>
                    <li>
                      <a
                        className="text-blue-600 hover:underline"
                        href="https://ads.google.com/aw/apicenter"
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        API Center에서 확인
                      </a>
                    </li>
                  </ul>
                </div>
                <Divider />
                <div>
                  <p className="font-semibold text-green-600">계정 ID 구분</p>
                  <ul className="list-disc list-inside mt-1 space-y-1 text-gray-600">
                    <li>
                      <strong>Login Customer ID (MCC)</strong>: 관리자 계정 ID
                      (예: 261-609-8766)
                    </li>
                    <li>
                      <strong>Customer ID</strong>: 실제 작업할 광고주 계정 ID
                      (예: 810-530-8586)
                    </li>
                    <li>
                      MCC 계정으로 로그인하여 여러 하위 계정을 관리할 수
                      있습니다
                    </li>
                  </ul>
                </div>
                <Divider />
                <div>
                  <p className="font-semibold text-blue-600">
                    권한 문제 해결 방법
                  </p>
                  <ul className="list-disc list-inside mt-1 space-y-1 text-gray-600">
                    <li>Google Ads 계정이 MCC(관리자) 계정인지 확인</li>
                    <li>
                      Developer Token이 해당 MCC 계정과 연결되어 있는지 확인
                    </li>
                    <li>
                      OAuth 동의 화면에서 필요한 권한을 모두 승인했는지 확인
                    </li>
                    <li>기존 토큰이 있다면 삭제하고 다시 인증 시도</li>
                  </ul>
                </div>
              </div>
            </CardBody>
          </Card>

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
                    {account.name} ({account.id})
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
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{campaign.name}</p>
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
                          campaign.status === "ENABLED" ? "PAUSED" : "ENABLED";

                        updateCampaignStatus(
                          credentials,
                          selectedAccountId,
                          campaign.id,
                          newStatus
                        )
                          .then((result) => {
                            if (result.success) {
                              setCampaigns((prev) =>
                                prev.map((c) =>
                                  c.id === campaign.id
                                    ? { ...c, status: newStatus }
                                    : c
                                )
                              );
                            } else {
                              setError(result.error || "캠페인 상태 변경 실패");
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
                <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
              </div>
            )}

            {apiResponse &&
              apiResponse.success === true &&
              apiResponse.authUrl && (
                <div className="space-y-2">
                  <p className="font-semibold">응답 데이터:</p>
                  <Snippet color="primary">{apiResponse.authUrl}</Snippet>
                </div>
              )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
