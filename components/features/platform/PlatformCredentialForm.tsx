"use client";

import { useState } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";

import { PlatformType } from "@/types";
import { useDictionary } from "@/hooks/use-dictionary";

// Form values type for the credential form
interface FormCredentials {
  clientId?: string;
  clientSecret?: string;
  customerId?: string;
  accessKey?: string;
  secretKey?: string;
}

interface PlatformCredentialFormProps {
  platform: PlatformType;
  initialValues?: FormCredentials;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
}

export const CREDENTIAL_FORM_ID = "credential-form" as const;

export function PlatformCredentialForm({
  platform,
  initialValues,
  onSubmit,
}: PlatformCredentialFormProps) {
  const { dictionary: dict } = useDictionary();
  const [values, setValues] = useState<FormCredentials>(initialValues || {});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const submissionValues: Record<string, unknown> = { ...values };

      // For OAuth platforms (Google, Facebook, Kakao), we don't need manual credentials anymore
      // These will be handled by Sivera's OAuth flow
      if (
        platform === "google" ||
        platform === "facebook" ||
        platform === "kakao"
      ) {
        // OAuth platforms don't need manual credentials
        await onSubmit({ ...values });

        return;
      }

      // Map Naver credentials (still uses API key authentication)
      if (platform === "naver") {
        submissionValues.client_id = values.clientId;
        submissionValues.client_secret = values.clientSecret;
        submissionValues.customer_id = values.customerId;
      }

      // Map Coupang credentials (still uses API key authentication)
      if (platform === "coupang") {
        submissionValues.access_key = values.accessKey;
        submissionValues.secret_key = values.secretKey;
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
              {dict.integrations.credentials.oauthInfo.replace(
                "{{platform}}",
                platform === "google"
                  ? "Google"
                  : platform === "facebook"
                    ? "Facebook"
                    : "Kakao",
              )}
            </p>
          </div>
          <Chip color="success" size="sm" variant="flat">
            {dict.integrations.credentials.oauthSupported}
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
              label={dict.integrations.credentials.apiKey}
              placeholder={dict.integrations.credentials.naverApiKeyPlaceholder}
              value={values.clientId || ""}
              onChange={(e) =>
                setValues({ ...values, clientId: e.target.value })
              }
            />
            <Input
              isRequired
              label={dict.integrations.credentials.secretKey}
              placeholder={dict.integrations.credentials.secretKey}
              type="password"
              value={values.clientSecret || ""}
              onChange={(e) =>
                setValues({ ...values, clientSecret: e.target.value })
              }
            />
            <Input
              isRequired
              label={dict.integrations.credentials.customerId}
              placeholder={dict.integrations.credentials.customerIdPlaceholder}
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
              label={dict.integrations.credentials.accessKey}
              placeholder={
                dict.integrations.credentials.coupangAccessKeyPlaceholder
              }
              value={values.accessKey || ""}
              onChange={(e) =>
                setValues({ ...values, accessKey: e.target.value })
              }
            />
            <Input
              isRequired
              label={dict.integrations.credentials.secretKey}
              placeholder={
                dict.integrations.credentials.coupangSecretKeyPlaceholder
              }
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
    <form className="space-y-4" id={CREDENTIAL_FORM_ID} onSubmit={handleSubmit}>
      {renderFields()}
      {showSubmitButton && (
        <Button
          className="w-full"
          color="primary"
          isLoading={isSubmitting}
          type="submit"
        >
          {dict.common.save}
        </Button>
      )}
    </form>
  );
}
