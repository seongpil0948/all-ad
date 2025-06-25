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
import { platformConfig } from "@/constants/platform-config";

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
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleAddOrEdit = useCallback(
    (platform: PlatformType) => {
      const config = platformConfig[platform];

      // For OAuth platforms with All-AD credentials, redirect directly
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
    async (credentials: CredentialValues) => {
      if (!selectedPlatform) return;

      setIsLoading(true);
      try {
        // For API key platforms (Naver, Coupang), save the credentials
        // OAuth platforms are handled by redirect in handleAddOrEdit
        await onSave(selectedPlatform, credentials);
        onOpenChange();
      } finally {
        setIsLoading(false);
      }
    },
    [selectedPlatform, onSave, onOpenChange],
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

  return (
    <>
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">플랫폼 인증 관리</h3>
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
      {credentials.find((c) => c.platform === "coupang" && c.isActive) && (
        <CoupangManualCampaignManager teamId={teamId} />
      )}

      <Modal isOpen={isOpen} size="2xl" onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {selectedPlatform && platformConfig[selectedPlatform].name} 인증
                정보
              </ModalHeader>
              <ModalBody>
                {selectedPlatform && (
                  <PlatformCredentialForm
                    initialValues={
                      getCredentialForPlatform(selectedPlatform)?.credentials
                    }
                    platform={selectedPlatform}
                    onSubmit={handleSave}
                  />
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  취소
                </Button>
                <Button
                  color="primary"
                  form="credential-form"
                  isLoading={isLoading}
                  type="submit"
                >
                  저장
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
