"use client";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Divider } from "@heroui/divider";
import { Code } from "@heroui/code";
import { Snippet } from "@heroui/snippet";

import PlatformTestCard from "./PlatformTestCard";

import log from "@/utils/logger";

interface MetaCredentials {
  appId: string;
  appSecret: string;
  accessToken: string;
  systemUserToken?: string;
  businessId?: string;
}

interface TestItem {
  id: string;
  name: string;
  description: string;
  status: "pending" | "testing" | "success" | "error";
  error?: string;
}

export default function MetaAdsTest() {
  const [credentials, setCredentials] = useState<MetaCredentials>({
    appId: "",
    appSecret: "",
    accessToken: "",
    systemUserToken: "",
    businessId: "",
  });

  const [authCode, setAuthCode] = useState(""); // OAuth 콜백에서 받은 코드 (현재는 직접 토큰 입력 방식)
  const [loading] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [testItems, setTestItems] = useState<TestItem[]>([
    {
      id: "auth",
      name: "인증 확인",
      description: "Access Token 유효성 검증",
      status: "pending",
    },
    {
      id: "business",
      name: "Business Manager 연결",
      description: "Business Portfolio 정보 조회",
      status: "pending",
    },
    {
      id: "adaccounts",
      name: "광고 계정 목록",
      description: "접근 가능한 광고 계정 조회",
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
      client_id: credentials.appId,
      redirect_uri: `${window.location.origin}/lab/meta`,
      scope:
        "ads_management,ads_read,business_management,pages_read_engagement",
      response_type: "code",
    });

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;

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
          result = await testAuthToken();
          break;
        case "business":
          result = await testBusinessManager();
          break;
        case "adaccounts":
          result = await testAdAccounts();
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

  const testAuthToken = async () => {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me?access_token=${credentials.accessToken}`,
    );
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return data;
  };

  const testBusinessManager = async () => {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${credentials.businessId}?fields=id,name,created_time&access_token=${credentials.accessToken}`,
    );
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return data;
  };

  const testAdAccounts = async () => {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${credentials.businessId}/owned_ad_accounts?fields=id,name,account_status,currency&access_token=${credentials.accessToken}`,
    );
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return data;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="space-y-4">
          <h2 className="text-xl font-semibold">Meta API 설정</h2>

          <Card className="bg-blue-50 border-blue-200">
            <CardBody className="text-sm space-y-2">
              <h3 className="font-semibold">📋 설정 가이드</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Meta for Developers에서 앱 생성</li>
                <li>Business Manager에서 System User 생성</li>
                <li>필요한 권한: ads_management, ads_read</li>
                <li>App Review 후 Advanced Access 필요</li>
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
            label="Business ID"
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
            Facebook Login 시작
          </Button>

          <Input
            label="Access Token"
            placeholder="Graph API Explorer에서 토큰 생성 가능"
            value={credentials.accessToken}
            onChange={(e) =>
              setCredentials({ ...credentials, accessToken: e.target.value })
            }
          />
        </CardBody>
      </Card>

      <PlatformTestCard
        isLoading={loading}
        testItems={testItems}
        title="Meta Ads API 연동 테스트"
        onRunTest={runTest}
      />

      <Card>
        <CardBody className="space-y-3">
          <h3 className="font-semibold">빠른 참조</h3>
          <Snippet size="sm" symbol="📍">
            Graph API Explorer: developers.facebook.com/tools/explorer
          </Snippet>
          <Snippet size="sm" symbol="📍">
            Business Manager: business.facebook.com
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
