"use client";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Divider } from "@heroui/divider";
import { Code } from "@heroui/code";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";

import PlatformTestCard from "./PlatformTestCard";

import log from "@/utils/logger";

interface AmazonCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  accessToken?: string;
  profileId?: string;
  region: "NA" | "EU" | "FE";
}

interface TestItem {
  id: string;
  name: string;
  description: string;
  status: "pending" | "testing" | "success" | "error";
  error?: string;
}

export default function AmazonAdsTest() {
  const [credentials, setCredentials] = useState<AmazonCredentials>({
    clientId: "",
    clientSecret: "",
    refreshToken: "",
    accessToken: "",
    profileId: "",
    region: "NA",
  });

  const [authCode, setAuthCode] = useState("");
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [testItems, setTestItems] = useState<TestItem[]>([
    {
      id: "auth",
      name: "인증 토큰 교환",
      description: "Authorization Code를 Access Token으로 교환",
      status: "pending",
    },
    {
      id: "profiles",
      name: "프로필 조회",
      description: "접근 가능한 광고 프로필 목록",
      status: "pending",
    },
    {
      id: "campaigns",
      name: "Sponsored Products 캠페인",
      description: "SP 캠페인 목록 조회 (v3)",
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
      client_id: credentials.clientId,
      scope: "advertising::campaign_management",
      response_type: "code",
      redirect_uri: `${window.location.origin}/api/auth/callback/amazon-ads`,
    });

    const authUrl = `https://www.amazon.com/ap/oa?${params.toString()}`;

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
        case "profiles":
          result = await testProfiles();
          break;
        case "campaigns":
          result = await testSponsoredProducts();
          break;
      }

      setTestItems((prev) =>
        prev.map((item) =>
          item.id === testId
            ? { ...item, status: "success", error: undefined }
            : item,
        ),
      );

      setApiResponse(result);
    } catch (error: any) {
      setTestItems((prev) =>
        prev.map((item) =>
          item.id === testId
            ? {
                ...item,
                status: "error",
                error: error.message || "테스트 실패",
              }
            : item,
        ),
      );

      setError(error.message);
      log.error(`Test ${testId} failed`, error);
    }
  };

  const testTokenExchange = async () => {
    if (!authCode) {
      throw new Error("Authorization Code가 필요합니다");
    }

    // 실제 구현 시 서버 액션으로 처리
    const mockResponse = {
      access_token: "Atza|...",
      refresh_token: "Atzr|...",
      token_type: "bearer",
      expires_in: 3600,
    };

    setCredentials((prev) => ({
      ...prev,
      accessToken: mockResponse.access_token,
      refreshToken: mockResponse.refresh_token,
    }));

    return mockResponse;
  };

  const testProfiles = async () => {
    const mockData = {
      profiles: [
        {
          profileId: "123456789",
          countryCode: "US",
          currencyCode: "USD",
          dailyBudget: 1000.0,
          timezone: "America/Los_Angeles",
        },
      ],
    };

    return mockData;
  };

  const testSponsoredProducts = async () => {
    const mockData = {
      campaigns: [
        {
          campaignId: "SP123456789",
          name: "Holiday Sale - Electronics",
          state: "enabled",
          dailyBudget: 100.0,
        },
      ],
    };

    return mockData;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="space-y-4">
          <h2 className="text-xl font-semibold">Amazon API 설정</h2>

          <Card className="bg-orange-50 border-orange-200">
            <CardBody className="text-sm space-y-2">
              <h3 className="font-semibold">📋 설정 가이드</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Amazon Advertising Console에서 앱 등록</li>
                <li>API 액세스 승인 필요 (2-7 영업일)</li>
                <li>Sponsored Products는 v3 완전 지원</li>
              </ul>
            </CardBody>
          </Card>

          <Select
            label="지역"
            placeholder="API 지역 선택"
            selectedKeys={[credentials.region]}
            onChange={(e) =>
              setCredentials({
                ...credentials,
                region: e.target.value as any,
              })
            }
          >
            <SelectItem key="NA">북미 (NA)</SelectItem>
            <SelectItem key="EU">유럽 (EU)</SelectItem>
            <SelectItem key="FE">극동 (FE)</SelectItem>
          </Select>

          <Input
            label="Client ID"
            placeholder="Amazon App Client ID"
            value={credentials.clientId}
            onChange={(e) =>
              setCredentials({ ...credentials, clientId: e.target.value })
            }
          />

          <Input
            label="Client Secret"
            placeholder="Amazon App Client Secret"
            type="password"
            value={credentials.clientSecret}
            onChange={(e) =>
              setCredentials({ ...credentials, clientSecret: e.target.value })
            }
          />

          <Divider />

          <h3 className="font-semibold">OAuth2 인증</h3>

          <Button
            color="primary"
            isDisabled={!credentials.clientId}
            onPress={handleGenerateAuthUrl}
          >
            Amazon OAuth 시작
          </Button>

          <Input
            label="Authorization Code"
            placeholder="OAuth 인증 후 자동 입력됩니다"
            value={authCode}
            onChange={(e) => setAuthCode(e.target.value)}
          />
        </CardBody>
      </Card>

      <PlatformTestCard
        testItems={testItems}
        title="Amazon Ads API 연동 테스트"
        onRunTest={runTest}
      />

      <Card>
        <CardBody className="space-y-3">
          <h3 className="font-semibold">API 버전 정보</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Chip color="success" size="sm">
                v3
              </Chip>
              <span className="text-sm">Sponsored Products (완전 지원)</span>
            </div>
            <div className="flex items-center gap-2">
              <Chip color="warning" size="sm">
                v2
              </Chip>
              <span className="text-sm">Sponsored Brands, Display</span>
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
