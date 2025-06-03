"use client";

import { Input } from "@heroui/input";
import { Form } from "@heroui/form";

import { PlatformType } from "@/types";

interface PlatformCredentialFormProps {
  platform: PlatformType;
  initialValues?: Record<string, any>;
  onSubmit: (credentials: Record<string, any>) => void;
}

// OAuth platforms now require users to provide their own OAuth app credentials
const platformFields: Record<
  PlatformType,
  Array<{
    name: string;
    label: string;
    type: string;
    placeholder: string;
    helperText?: string;
  }>
> = {
  // OAuth platforms - users must create their own OAuth apps
  facebook: [
    {
      name: "info",
      label: "Facebook OAuth 앱 설정 안내",
      type: "info",
      placeholder: "",
      helperText:
        "Facebook Developers (developers.facebook.com)에서 앱을 생성하고 아래 정보를 입력해주세요.",
    },
    {
      name: "redirect_uri_info",
      label: "중요: 리디렉션 URI 설정",
      type: "warning",
      placeholder: "",
      helperText: `Facebook 앱 설정 > Facebook 로그인 > 설정에서 다음 URI를 반드시 추가해주세요:\n${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/api/auth/callback/facebook-ads`,
    },
    {
      name: "client_id",
      label: "App ID",
      type: "text",
      placeholder: "Facebook App ID",
      helperText: "Facebook 앱 대시보드에서 확인할 수 있습니다",
    },
    {
      name: "client_secret",
      label: "App Secret",
      type: "password",
      placeholder: "Facebook App Secret",
      helperText: "설정 > 기본 설정에서 확인할 수 있습니다",
    },
    {
      name: "manual_refresh_token",
      label: "Access Token (선택사항)",
      type: "password",
      placeholder: "수동으로 생성한 Access Token",
      helperText:
        "OAuth 연동이 실패할 경우, Graph API Explorer에서 생성한 토큰을 입력하세요",
    },
  ],
  google: [
    {
      name: "info",
      label: "Google OAuth 앱 설정 안내",
      type: "info",
      placeholder: "",
      helperText:
        "Google Cloud Console (console.cloud.google.com)에서 OAuth 2.0 클라이언트를 생성하고 아래 정보를 입력해주세요.",
    },
    {
      name: "redirect_uri_info",
      label: "중요: 리디렉션 URI 설정",
      type: "warning",
      placeholder: "",
      helperText: `Google Cloud Console의 OAuth 2.0 클라이언트 설정에서 다음 URI를 반드시 추가해주세요:\n${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/api/auth/callback/google-ads`,
    },
    {
      name: "client_id",
      label: "Client ID",
      type: "text",
      placeholder: "Google OAuth Client ID",
      helperText: "OAuth 2.0 클라이언트 ID",
    },
    {
      name: "client_secret",
      label: "Client Secret",
      type: "password",
      placeholder: "Google OAuth Client Secret",
      helperText: "OAuth 2.0 클라이언트 시크릿",
    },
    {
      name: "developer_token",
      label: "Developer Token",
      type: "text",
      placeholder: "Google Ads Developer Token",
      helperText: "Google Ads API Center에서 발급받은 개발자 토큰",
    },
    {
      name: "manual_refresh_token",
      label: "Refresh Token (선택사항)",
      type: "password",
      placeholder: "수동으로 생성한 Refresh Token",
      helperText:
        "OAuth 연동이 실패할 경우, 수동으로 생성한 리프레시 토큰을 입력하세요",
    },
  ],
  kakao: [
    {
      name: "info",
      label: "Kakao OAuth 앱 설정 안내",
      type: "info",
      placeholder: "",
      helperText:
        "Kakao Developers (developers.kakao.com)에서 앱을 생성하고 아래 정보를 입력해주세요.",
    },
    {
      name: "redirect_uri_info",
      label: "중요: 리디렉션 URI 설정",
      type: "warning",
      placeholder: "",
      helperText: `Kakao Developers > 앱 설정 > 플랫폼 > Redirect URI에 다음 URI를 반드시 추가해주세요:\n${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/api/auth/callback/kakao-ads`,
    },
    {
      name: "client_id",
      label: "REST API 키",
      type: "text",
      placeholder: "Kakao REST API Key",
      helperText: "앱 키 > REST API 키",
    },
    {
      name: "client_secret",
      label: "Client Secret",
      type: "password",
      placeholder: "Kakao Client Secret",
      helperText: "보안 > Client Secret (사용 설정 필요)",
    },
    {
      name: "manual_refresh_token",
      label: "Refresh Token (선택사항)",
      type: "password",
      placeholder: "수동으로 생성한 Refresh Token",
      helperText:
        "OAuth 연동이 실패할 경우, 수동으로 생성한 리프레시 토큰을 입력하세요",
    },
  ],
  // API key-based platforms - manual input required
  naver: [
    {
      name: "api_key",
      label: "API License Key",
      type: "text",
      placeholder: "네이버 검색광고 API License Key",
      helperText: "네이버 검색광고 관리 시스템 > 도구 > API 관리에서 발급",
    },
    {
      name: "secret_key",
      label: "Secret Key",
      type: "password",
      placeholder: "네이버 검색광고 API Secret Key",
      helperText: "API License 생성 시 함께 발급된 Secret Key",
    },
    {
      name: "customer_id",
      label: "Customer ID",
      type: "text",
      placeholder: "네이버 검색광고 고객 ID",
      helperText: "네이버 검색광고 계정의 고객 ID (관리 시스템에서 확인 가능)",
    },
  ],
  coupang: [
    {
      name: "info",
      label: "연동 제한 안내",
      type: "warning",
      placeholder: "",
      helperText:
        "쿠팡은 현재 광고 API를 제공하지 않습니다. 쿠팡 광고 데이터는 수동으로 관리해야 합니다. 향후 API가 제공되면 자동 연동을 지원할 예정입니다.",
    },
  ],
};

export function PlatformCredentialForm({
  platform,
  initialValues,
  onSubmit,
}: PlatformCredentialFormProps) {
  const fields = platformFields[platform];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const credentials: Record<string, any> = {};

    fields.forEach((field) => {
      const value = formData.get(field.name);

      if (value) {
        credentials[field.name] = value;
      }
    });

    onSubmit(credentials);
  };

  return (
    <Form id="credential-form" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-4">
        {fields.map((field) => {
          // Handle info/warning messages differently
          if (field.type === "info" || field.type === "warning") {
            return (
              <div
                key={field.name}
                className={`p-4 rounded-lg ${
                  field.type === "warning"
                    ? "bg-warning-50 dark:bg-warning-100/10 text-warning-700 dark:text-warning-400"
                    : "bg-primary-50 dark:bg-primary-100/10 text-primary-700 dark:text-primary-400"
                }`}
              >
                <p className="font-medium mb-1">{field.label}</p>
                {field.name === "redirect_uri_info" ? (
                  <div className="text-sm space-y-2">
                    <p>
                      Google Cloud Console의 OAuth 2.0 클라이언트 설정에서 다음
                      URI를 반드시 추가해주세요:
                    </p>
                    <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs break-all">
                      {typeof window !== "undefined"
                        ? window.location.origin
                        : "http://localhost:3000"}
                      /api/auth/callback/google-ads
                    </code>
                  </div>
                ) : (
                  <p className="text-sm">{field.helperText}</p>
                )}
              </div>
            );
          }

          // Regular input fields
          return (
            <Input
              key={field.name}
              defaultValue={initialValues?.[field.name] || ""}
              description={field.helperText}
              isRequired={!field.label.includes("선택")}
              label={field.label}
              name={field.name}
              placeholder={field.placeholder}
              type={field.type}
              variant="bordered"
            />
          );
        })}
      </div>
    </Form>
  );
}
