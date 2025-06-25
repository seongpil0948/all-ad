"use client";

import { useState } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";

import { PlatformType } from "@/types";
import { CredentialValues } from "@/types/credentials.types";

interface PlatformCredentialFormProps {
  platform: PlatformType;
  initialValues?: CredentialValues;
  onSubmit: (values: CredentialValues) => Promise<void>;
}

export function PlatformCredentialForm({
  platform,
  initialValues,
  onSubmit,
}: PlatformCredentialFormProps) {
  const [values, setValues] = useState<CredentialValues>(initialValues || {});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const submissionValues = { ...values };

      // For OAuth platforms (Google, Facebook, Kakao), we don't need manual credentials anymore
      // These will be handled by All-AD's OAuth flow
      if (
        platform === "google" ||
        platform === "facebook" ||
        platform === "kakao"
      ) {
        // OAuth platforms don't need manual credentials
        await onSubmit({});

        return;
      }

      // Map Naver credentials (still uses API key authentication)
      if (platform === "naver") {
        submissionValues.client_id = values.clientId;
        submissionValues.client_secret = values.clientSecret;
        submissionValues.customer_id = values.customerId;

        delete submissionValues.clientId;
        delete submissionValues.clientSecret;
        delete submissionValues.customerId;
      }

      // Map Coupang credentials (still uses API key authentication)
      if (platform === "coupang") {
        submissionValues.access_key = values.accessKey;
        submissionValues.secret_key = values.secretKey;

        delete submissionValues.accessKey;
        delete submissionValues.secretKey;
      }

      await onSubmit(submissionValues);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFields = () => {
    // OAuth platforms (Google, Facebook, Kakao) - show info message only
    if (
      platform === "google" ||
      platform === "facebook" ||
      platform === "kakao"
    ) {
      return (
        <div className="space-y-4">
          <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
            <p className="text-sm text-primary-700 dark:text-primary-300">
              이 플랫폼은 OAuth 인증을 사용합니다. &quot;연동하기&quot; 버튼을
              클릭하면{" "}
              {platform === "google"
                ? "Google"
                : platform === "facebook"
                  ? "Facebook"
                  : "Kakao"}{" "}
              로그인 페이지로 이동합니다.
            </p>
          </div>
          <Chip color="success" size="sm" variant="flat">
            OAuth 인증 지원
          </Chip>
        </div>
      );
    }

    switch (platform) {
      case "naver":
        return (
          <>
            <Input
              isRequired
              label="API Key"
              placeholder="네이버 검색광고 API Key"
              value={values.clientId || ""}
              onChange={(e) =>
                setValues({ ...values, clientId: e.target.value })
              }
            />
            <Input
              isRequired
              label="Secret Key"
              placeholder="Secret Key"
              type="password"
              value={values.clientSecret || ""}
              onChange={(e) =>
                setValues({ ...values, clientSecret: e.target.value })
              }
            />
            <Input
              isRequired
              label="Customer ID"
              placeholder="고객 ID"
              value={values.customerId || ""}
              onChange={(e) =>
                setValues({ ...values, customerId: e.target.value })
              }
            />
          </>
        );

      case "coupang":
        return (
          <>
            <Input
              isRequired
              label="Access Key"
              placeholder="쿠팡 Access Key"
              value={values.accessKey || ""}
              onChange={(e) =>
                setValues({ ...values, accessKey: e.target.value })
              }
            />
            <Input
              isRequired
              label="Secret Key"
              placeholder="쿠팡 Secret Key"
              type="password"
              value={values.secretKey || ""}
              onChange={(e) =>
                setValues({ ...values, secretKey: e.target.value })
              }
            />
          </>
        );

      default:
        return null;
    }
  };

  // Don't show submit button for OAuth platforms
  const showSubmitButton = !["google", "facebook", "kakao"].includes(platform);

  return (
    <form className="space-y-4" id="credential-form" onSubmit={handleSubmit}>
      {renderFields()}
      {showSubmitButton && (
        <Button
          className="w-full"
          color="primary"
          isLoading={isSubmitting}
          type="submit"
        >
          저장
        </Button>
      )}
    </form>
  );
}
