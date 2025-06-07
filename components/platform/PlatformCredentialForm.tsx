"use client";

import { useState } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";

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
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFields = () => {
    switch (platform) {
      case "google":
        return (
          <>
            <Input
              required
              label="Client ID"
              placeholder="Google OAuth Client ID"
              value={values.clientId || ""}
              onChange={(e) =>
                setValues({ ...values, clientId: e.target.value })
              }
            />
            <Input
              required
              label="Client Secret"
              placeholder="Google OAuth Client Secret"
              type="password"
              value={values.clientSecret || ""}
              onChange={(e) =>
                setValues({ ...values, clientSecret: e.target.value })
              }
            />
            <Input
              label="Developer Token"
              placeholder="Google Ads Developer Token"
              value={values.developerToken || ""}
              onChange={(e) =>
                setValues({ ...values, developerToken: e.target.value })
              }
            />
            <Input
              label="MCC Account ID (Manager Customer ID)"
              placeholder="123-456-7890 (대시 없이)"
              value={values.loginCustomerId || ""}
              onChange={(e) =>
                setValues({
                  ...values,
                  loginCustomerId: e.target.value.replace(/-/g, ""),
                })
              }
            />
            <Input
              label="Refresh Token (Optional)"
              placeholder="수동으로 얻은 Refresh Token"
              value={values.refreshToken || ""}
              onChange={(e) =>
                setValues({ ...values, refreshToken: e.target.value })
              }
            />
          </>
        );

      case "facebook":
        return (
          <>
            <Input
              required
              label="App ID"
              placeholder="Facebook App ID"
              value={values.appId || ""}
              onChange={(e) => setValues({ ...values, appId: e.target.value })}
            />
            <Input
              required
              label="App Secret"
              placeholder="Facebook App Secret"
              type="password"
              value={values.appSecret || ""}
              onChange={(e) =>
                setValues({ ...values, appSecret: e.target.value })
              }
            />
            <Input
              label="Access Token (Optional)"
              placeholder="수동으로 얻은 Access Token"
              value={values.accessToken || ""}
              onChange={(e) =>
                setValues({ ...values, accessToken: e.target.value })
              }
            />
          </>
        );

      case "kakao":
        return (
          <>
            <Input
              required
              label="REST API Key"
              placeholder="Kakao REST API Key"
              value={values.restApiKey || ""}
              onChange={(e) =>
                setValues({ ...values, restApiKey: e.target.value })
              }
            />
            <Input
              required
              label="Secret Key"
              placeholder="Kakao Secret Key"
              type="password"
              value={values.secretKey || ""}
              onChange={(e) =>
                setValues({ ...values, secretKey: e.target.value })
              }
            />
            <Input
              label="Refresh Token (Optional)"
              placeholder="수동으로 얻은 Refresh Token"
              value={values.refreshToken || ""}
              onChange={(e) =>
                setValues({ ...values, refreshToken: e.target.value })
              }
            />
          </>
        );

      case "naver":
        return (
          <>
            <Input
              required
              label="Client ID"
              placeholder="Naver Client ID"
              value={values.clientId || ""}
              onChange={(e) =>
                setValues({ ...values, clientId: e.target.value })
              }
            />
            <Input
              required
              label="Client Secret"
              placeholder="Naver Client Secret"
              type="password"
              value={values.clientSecret || ""}
              onChange={(e) =>
                setValues({ ...values, clientSecret: e.target.value })
              }
            />
            <Input
              label="Customer ID"
              placeholder="Naver Ads Customer ID"
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
              required
              label="Access Key"
              placeholder="Coupang Access Key"
              value={values.accessKey || ""}
              onChange={(e) =>
                setValues({ ...values, accessKey: e.target.value })
              }
            />
            <Input
              required
              label="Secret Key"
              placeholder="Coupang Secret Key"
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

  return (
    <form className="space-y-4" id="credential-form" onSubmit={handleSubmit}>
      {renderFields()}
      <Button
        className="hidden"
        color="primary"
        isLoading={isSubmitting}
        type="submit"
      >
        저장
      </Button>
    </form>
  );
}
