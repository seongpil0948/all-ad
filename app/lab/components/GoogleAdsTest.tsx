"use client";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Divider } from "@heroui/divider";
import { Code } from "@heroui/code";
import { Select, SelectItem } from "@heroui/select";

import log from "@/utils/logger";
import {
  GoogleAdsTestCredentials,
  GoogleAdsCampaign,
  generateAuthUrl,
  fetchGoogleAdsAccounts,
  testConnection,
} from "@/app/lab/actions";
import { useIsSSR } from "@react-aria/ssr";

interface GoogleAdsAccount {
  id: string;
  name: string;
  currencyCode?: string;
  timeZone?: string;
  isManager?: boolean;
}

export default function GoogleAdsTest() {
  const [credentials, setCredentials] = useState<GoogleAdsTestCredentials>({
    clientId: "",
    clientSecret: "",
    developerToken: "",
    refreshToken: "",
    loginCustomerId: "",
  });
  const isSSR = useIsSSR();

  const [authCode, setAuthCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<GoogleAdsAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [campaigns, setCampaigns] = useState<GoogleAdsCampaign[]>([]);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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

  // 연결 테스트
  const handleTestConnection = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await testConnection(credentials);

      if (result.success) {
        setApiResponse(result);
        log.info("Connection test successful");
      } else {
        setError(result.error || "연결 테스트 실패");
        setApiResponse(result);
      }
    } catch (err) {
      setError("연결 테스트 중 오류 발생");
      log.error("Connection test error", err);
    } finally {
      setLoading(false);
    }
  };

  // OAuth2 인증 URL 생성
  const handleGenerateAuthUrl = async () => {
    setLoading(true);
    setError(null);
    try {
      const redirectUri = `${window.location.origin}/api/auth/callback/google-ads`;
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
    } finally {
      setLoading(false);
    }
  };

  // 계정 목록 가져오기
  const handleFetchAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchGoogleAdsAccounts(credentials);

      if (result.success && result.accounts) {
        setAccounts(result.accounts);
        setApiResponse(result);
      } else {
        setError(result.error || "계정 목록 조회 실패");
        setApiResponse(result);
      }
    } catch (err) {
      setError("계정 목록 조회 중 오류 발생");
      log.error("Fetch accounts error", err);
    } finally {
      setLoading(false);
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
              <div className="space-y-2">
                <div>
                  <p className="font-semibold text-red-600">
                    redirect_uri_mismatch 오류
                  </p>
                  <p className="text-gray-700">리디렉션 URI 추가 필요:</p>
                  <Code className="mt-1 text-xs">
                    {`${window.location.origin}/api/auth/callback/google-ads`}
                  </Code>
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
            isLoading={loading}
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

          <Divider />

          <Button
            className="w-full"
            color="success"
            isDisabled={
              !credentials.refreshToken || !credentials.developerToken
            }
            isLoading={loading}
            onPress={handleTestConnection}
          >
            연결 테스트
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Google Ads 계정</h2>
            <Button
              color="primary"
              isDisabled={!credentials.refreshToken}
              isLoading={loading}
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
