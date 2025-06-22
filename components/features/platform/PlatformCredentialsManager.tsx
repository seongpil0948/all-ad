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

import { OAuthClient } from "@/lib/oauth/oauth-client";
import { getOAuthConfig } from "@/lib/oauth/platform-configs.client";
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
  userId,
}: PlatformCredentialsManagerProps) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleAddOrEdit = useCallback(
    (platform: PlatformType) => {
      // All platforms now show the form (OAuth platforms need credentials first)
      setSelectedPlatform(platform);
      onOpen();
    },
    [onOpen],
  );

  const handleOAuthConnect = useCallback(
    async (platform: PlatformType, credentials: CredentialValues) => {
      // Store the OAuth credentials first
      await onSave(platform, credentials);

      // Create OAuth config with user-provided credentials
      if (!credentials.client_id || !credentials.client_secret) {
        throw new Error("Client ID and Client Secret are required for OAuth");
      }

      const oauthConfig = {
        clientId: credentials.client_id,
        clientSecret: credentials.client_secret,
        redirectUri: `${window.location.origin}/api/auth/callback/${platform}-ads`,
        scope: getOAuthConfig(platform)?.scope || [],
        authorizationUrl: getOAuthConfig(platform)?.authorizationUrl || "",
        tokenUrl: getOAuthConfig(platform)?.tokenUrl || "",
      };

      const oauthClient = new OAuthClient(platform, oauthConfig);

      // Create state for OAuth flow
      const state = Buffer.from(
        JSON.stringify({
          userId,
          teamId,
          platform,
          timestamp: Date.now(),
        }),
      ).toString("base64");

      // Redirect to OAuth authorization URL
      const authUrl = oauthClient.getAuthorizationUrl(state);

      window.location.href = authUrl;
    },
    [onSave, teamId, userId],
  );

  const handleSave = useCallback(
    async (credentials: CredentialValues) => {
      if (!selectedPlatform) return;

      setIsLoading(true);
      try {
        const config = platformConfig[selectedPlatform];

        if (config.supportsOAuth) {
          // Check if manual refresh token is provided
          if (
            "manual_refresh_token" in credentials &&
            credentials.manual_refresh_token
          ) {
            // Save credentials with manual refresh token
            const { manual_refresh_token, ...oauthCredentials } = credentials;

            await onSave(selectedPlatform, {
              ...oauthCredentials,
              refresh_token: manual_refresh_token as string,
              manual_token: true,
            });
            onOpenChange();
          } else {
            // For OAuth platforms, save credentials and then initiate OAuth flow
            await handleOAuthConnect(selectedPlatform, credentials);
          }
        } else {
          // For API key platforms, just save the credentials
          await onSave(selectedPlatform, credentials);
          onOpenChange();
        }
      } finally {
        setIsLoading(false);
      }
    },
    [
      selectedPlatform,
      platformConfig,
      onSave,
      handleOAuthConnect,
      onOpenChange,
    ],
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
