"use client";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Divider } from "@heroui/divider";
import { Code } from "@heroui/code";
import { Badge } from "@heroui/badge";

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

    const mockResponse = {
      code: 0,
      message: "OK",
      data: {
        access_token: "act.example123456789",
        advertiser_ids: ["7123456789012345"],
        scope: ["ads.management", "reporting"],
        token_type: "Bearer",
      },
    };

    setCredentials((prev) => ({
      ...prev,
      accessToken: mockResponse.data.access_token,
      advertiserId: mockResponse.data.advertiser_ids[0],
    }));

    return mockResponse;
  };

  const testAdvertiserInfo = async () => {
    if (!credentials.advertiserId) {
      throw new Error("Advertiser ID가 필요합니다");
    }

    const mockData = {
      code: 0,
      message: "OK",
      data: {
        advertiser_id: credentials.advertiserId,
        advertiser_name: "Test Business",
        currency: "USD",
        balance: 1000.0,
      },
    };

    return mockData;
  };

  const testCampaigns = async () => {
    const mockData = {
      code: 0,
      message: "OK",
      data: {
        list: [
          {
            campaign_id: "1234567890",
            campaign_name: "Summer Sale 2025",
            objective_type: "CONVERSIONS",
            budget: 500.0,
            status: "CAMPAIGN_STATUS_ENABLE",
          },
        ],
        page_info: {
          total_number: 1,
        },
      },
    };

    return mockData;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="space-y-4">
          <h2 className="text-xl font-semibold">TikTok API 설정</h2>

          <Card className="bg-gray-50 border-gray-200">
            <CardBody className="text-sm space-y-2">
              <h3 className="font-semibold">📋 설정 가이드</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>TikTok Developers에서 앱 생성</li>
                <li>Business API 액세스 승인 필요 (2-7일)</li>
                <li>Access Token: 24시간 유효</li>
                <li>웹훅은 광고 이벤트 미지원</li>
              </ul>
            </CardBody>
          </Card>

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
