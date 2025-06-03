"use client";

import { Input } from "@heroui/input";
import { Form } from "@heroui/form";

import { PlatformType } from "@/types";

interface PlatformCredentialFormProps {
  platform: PlatformType;
  initialValues?: Record<string, any>;
  onSubmit: (credentials: Record<string, any>) => void;
}

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
  facebook: [
    {
      name: "access_token",
      label: "Access Token",
      type: "text",
      placeholder: "Facebook Access Token을 입력하세요",
      helperText: "Facebook Business Manager에서 발급받은 토큰",
    },
    {
      name: "ad_account_id",
      label: "Ad Account ID",
      type: "text",
      placeholder: "예: 123456789",
      helperText: "광고 계정 ID (act_ 제외)",
    },
    {
      name: "app_id",
      label: "App ID (선택)",
      type: "text",
      placeholder: "Facebook App ID",
    },
    {
      name: "app_secret",
      label: "App Secret (선택)",
      type: "password",
      placeholder: "Facebook App Secret",
    },
  ],
  google: [
    {
      name: "client_id",
      label: "Client ID",
      type: "text",
      placeholder: "Google OAuth Client ID",
      helperText: "Google Cloud Console에서 발급",
    },
    {
      name: "client_secret",
      label: "Client Secret",
      type: "password",
      placeholder: "Google OAuth Client Secret",
    },
    {
      name: "refresh_token",
      label: "Refresh Token",
      type: "text",
      placeholder: "Google OAuth Refresh Token",
    },
    {
      name: "developer_token",
      label: "Developer Token (선택)",
      type: "text",
      placeholder: "Google Ads Developer Token",
    },
    {
      name: "customer_id",
      label: "Customer ID (선택)",
      type: "text",
      placeholder: "예: 123-456-7890",
    },
  ],
  kakao: [
    {
      name: "access_token",
      label: "Access Token",
      type: "text",
      placeholder: "Kakao Moment Access Token",
    },
    {
      name: "refresh_token",
      label: "Refresh Token",
      type: "text",
      placeholder: "Kakao Moment Refresh Token",
    },
    {
      name: "ad_account_id",
      label: "광고 계정 ID",
      type: "text",
      placeholder: "Kakao Moment 광고 계정 ID",
    },
  ],
  naver: [
    {
      name: "access_token",
      label: "Access Token",
      type: "text",
      placeholder: "네이버 검색광고 API Access Token",
    },
    {
      name: "secret_key",
      label: "Secret Key",
      type: "password",
      placeholder: "네이버 검색광고 API Secret Key",
    },
    {
      name: "customer_id",
      label: "Customer ID",
      type: "text",
      placeholder: "네이버 검색광고 고객 ID",
    },
  ],
  coupang: [
    {
      name: "access_key",
      label: "Access Key",
      type: "text",
      placeholder: "쿠팡 Wing API Access Key",
    },
    {
      name: "secret_key",
      label: "Secret Key",
      type: "password",
      placeholder: "쿠팡 Wing API Secret Key",
    },
    {
      name: "vendor_id",
      label: "Vendor ID",
      type: "text",
      placeholder: "쿠팡 판매자 ID",
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
        {fields.map((field) => (
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
        ))}
      </div>
    </Form>
  );
}
