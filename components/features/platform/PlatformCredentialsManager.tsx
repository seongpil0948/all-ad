"use client";

import { useState, memo, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { useDisclosure } from "@heroui/modal";

import { PlatformCredentialForm } from "./PlatformCredentialForm";
import { CoupangManualCampaignManager } from "./coupang/CoupangManualCampaignManager";
import { PlatformCredentialItem } from "./PlatformCredentialItem";

import { PlatformCredential, PlatformType } from "@/types";
import { CredentialValues } from "@/types/credentials.types";
import { Json } from "@/types/supabase.types";
import { platformConfig } from "@/constants/platform-config";
import { useDictionary } from "@/hooks/use-dictionary";

interface PlatformCredentialsManagerProps {
  credentials: PlatformCredential[];
  onSave: (
    platform: PlatformType,
    credentials: CredentialValues,
  ) => Promise<void>;
  onDelete: (platform: PlatformType) => Promise<void>;
  onToggle: (platform: PlatformType, isActive: boolean) => Promise<void>;
  teamId: string;
  userId: string;
}

function PlatformCredentialsManagerComponent({
  credentials,
  onSave,
  onDelete,
  onToggle,
  teamId,
  userId: _userId,
}: PlatformCredentialsManagerProps) {
  const { dictionary: dict } = useDictionary();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleAddOrEdit = useCallback(
    (platform: PlatformType) => {
      const config = platformConfig[platform];

      // For OAuth platforms with Sivera credentials, redirect directly
      if (
        config.supportsOAuth &&
        ["google", "facebook", "kakao"].includes(platform)
      ) {
        // Redirect to OAuth flow
        const oauthRoutes = {
          google: "/api/auth/google-ads",
          facebook: "/api/auth/facebook-ads",
          kakao: "/api/auth/kakao-ads",
        };

        const route = oauthRoutes[platform as keyof typeof oauthRoutes];

        if (route) {
          window.location.href = route;

          return;
        }
      }

      // For API key platforms (Naver, Coupang), show the form
      setSelectedPlatform(platform);
      onOpen();
    },
    [onOpen],
  );

  const handleSave = useCallback(
    async (formValues: Record<string, unknown>) => {
      if (!selectedPlatform) return;

      setIsLoading(true);
      try {
        // Convert form values to CredentialValues format
        // The actual credential data will be in the credentials JSON field
        const credentials: CredentialValues = {
          access_token: null,
          account_id: `${selectedPlatform}_${Date.now()}`,
          account_name: null,
          created_at: new Date().toISOString(),
          created_by: _userId,
          credentials: formValues as { [key: string]: Json | undefined }, // The form values go into the credentials JSON field
          data: null,
          expires_at: null,
          id: crypto.randomUUID(),
          is_active: true,
          last_synced_at: null,
          platform: selectedPlatform,
          refresh_token: null,
          scope: null,
          team_id: teamId,
          updated_at: new Date().toISOString(),
        };

        // For API key platforms (Naver, Coupang), save the credentials
        // OAuth platforms are handled by redirect in handleAddOrEdit
        await onSave(selectedPlatform, credentials);
        onOpenChange();
      } finally {
        setIsLoading(false);
      }
    },
    [selectedPlatform, onSave, onOpenChange, _userId, teamId],
  );

  const handleToggle = useCallback(
    async (platform: PlatformType, isActive: boolean) => {
      await onToggle(platform, isActive);
    },
    [onToggle],
  );

  const getCredentialForPlatform = useCallback(
    (platform: PlatformType) => {
      return credentials.find((c) => c.platform === platform);
    },
    [credentials],
  );

  const convertCredentialToFormValues = useCallback(
    (credential: PlatformCredential | undefined) => {
      if (!credential) return undefined;

      // Extract form values from the credentials JSON field
      const credentialData = credential.credentials as Record<string, unknown>;

      return {
        clientId: credentialData?.client_id as string,
        clientSecret: credentialData?.client_secret as string,
        customerId: credentialData?.customer_id as string,
        accessKey: credentialData?.access_key as string,
        secretKey: credentialData?.secret_key as string,
      };
    },
    [],
  );

  return (
    <>
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">
            {dict.integrations.credentials.title}
          </h3>
        </CardHeader>
        <CardBody className="gap-4">
          {(Object.keys(platformConfig) as PlatformType[]).map((platform) => (
            <PlatformCredentialItem
              key={platform}
              credential={getCredentialForPlatform(platform)}
              platform={platform}
              onAddOrEdit={handleAddOrEdit}
              onDelete={onDelete}
              onToggle={handleToggle}
            />
          ))}
        </CardBody>
      </Card>

      {/* Coupang Manual Campaign Manager */}
      {credentials.find((c) => c.platform === "coupang" && c.is_active) && (
        <CoupangManualCampaignManager teamId={teamId} />
      )}

      <Modal isOpen={isOpen} size="2xl" onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {selectedPlatform &&
                  dict.integrations.credentials.modalTitle.replace(
                    "{{platform}}",
                    platformConfig[selectedPlatform].name,
                  )}
              </ModalHeader>
              <ModalBody>
                {selectedPlatform && (
                  <PlatformCredentialForm
                    initialValues={convertCredentialToFormValues(
                      getCredentialForPlatform(selectedPlatform),
                    )}
                    platform={selectedPlatform}
                    onSubmit={handleSave}
                  />
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  {dict.common.cancel}
                </Button>
                <Button
                  color="primary"
                  form="credential-form"
                  isLoading={isLoading}
                  type="submit"
                >
                  {dict.common.save}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}

export const PlatformCredentialsManager = memo(
  PlatformCredentialsManagerComponent,
);
