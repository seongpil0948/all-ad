"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import {
  FaGoogle,
  FaFacebook,
  FaSync,
  FaTrash,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaPlus,
  FaShoppingCart,
} from "react-icons/fa";
import { SiKakao, SiNaver } from "react-icons/si";

import { PlatformType } from "@/types";
import {
  getPlatformDisplayName,
  isPlatformOAuthSupported,
} from "@/lib/auth/oauth-handlers";
import log from "@/utils/logger";
import { useDictionary } from "@/hooks/use-dictionary";

interface PlatformCredential {
  id: string;
  platform: PlatformType;
  accountName: string;
  isActive: boolean;
  needsRefresh: boolean;
  hasError: boolean;
  errorMessage?: string;
  lastSync?: string;
  expiresAt?: string;
}

interface RefreshStatus {
  totalCredentials: number;
  credentialsNeedingRefresh: number;
  refreshService: {
    isRunning: boolean;
    hasInterval: boolean;
  };
  credentials: PlatformCredential[];
}

// Platform icons mapping
const PlatformIcons = {
  GOOGLE: FaGoogle,
  META: FaFacebook,
  KAKAO: SiKakao,
  NAVER: SiNaver,
  COUPANG: FaShoppingCart,
} as const;

// Platform colors
const PlatformColors = {
  GOOGLE: "primary",
  META: "secondary",
  KAKAO: "warning",
  NAVER: "success",
  COUPANG: "danger",
} as const;

export function PlatformIntegrations() {
  const [isPending, startTransition] = useTransition();
  const { dictionary: dict } = useDictionary();
  const [refreshStatus, setRefreshStatus] = useState<RefreshStatus | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCredential, setSelectedCredential] =
    useState<PlatformCredential | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Effect 1: Load initial data - separate concern
  useEffect(() => {
    fetchRefreshStatus();
  }, []);

  // Effect 2: Handle URL params for OAuth success/error - separate concern
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get("success");
    const error = urlParams.get("error");
    const platform = urlParams.get("platform");
    const account = urlParams.get("account");
    const message = urlParams.get("message");

    if (success === "platform_connected" && platform && account) {
      log.info("Platform connected successfully", { platform, account });
      // Show success notification using a toast or alert
      alert(
        dict.integrations.success.connected
          .replace(
            "{{platform}}",
            getPlatformDisplayName(platform.toUpperCase() as PlatformType),
          )
          .replace("{{account}}", decodeURIComponent(account)),
      );
      // Clear URL params
      window.history.replaceState({}, "", window.location.pathname);
      // Refresh data
      fetchRefreshStatus();
    } else if (error && platform) {
      let errorMessage = dict.integrations.errors.connectionFailed;

      switch (error) {
        case "oauth_cancelled":
          errorMessage = dict.integrations.errors.oauthCancelled;
          break;
        case "invalid_oauth_response":
          errorMessage = dict.integrations.errors.invalidOauthResponse;
          break;
        case "team_not_found":
          errorMessage = dict.integrations.errors.teamNotFound;
          break;
        case "oauth_failed":
          errorMessage = message
            ? decodeURIComponent(message)
            : dict.integrations.errors.oauthFailed;
          break;
        default:
          errorMessage = message ? decodeURIComponent(message) : errorMessage;
      }

      log.error("Platform connection failed", { error, platform, message });
      // Show error notification
      alert(
        `${getPlatformDisplayName(platform.toUpperCase() as PlatformType)} ${dict.integrations.errors.connectionFailed}\n${errorMessage}`,
      );
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const fetchRefreshStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/refresh");

      if (!response.ok) {
        throw new Error("Failed to fetch refresh status");
      }

      const data = await response.json();

      setRefreshStatus(data);
    } catch (error) {
      log.error("Failed to fetch refresh status", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleConnectPlatform = useCallback(async (platform: PlatformType) => {
    if (!isPlatformOAuthSupported(platform)) {
      log.warn("OAuth not supported for platform", { platform });

      return;
    }

    try {
      const response = await fetch(
        `/api/auth/oauth/${platform.toLowerCase()}/callback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to initiate OAuth");
      }

      const { authUrl } = await response.json();

      // Redirect to OAuth URL
      window.location.href = authUrl;
    } catch (error) {
      log.error("Failed to connect platform", { platform, error });
    }
  }, []);

  const handleRefreshTokens = useCallback(
    async (platform?: PlatformType) => {
      try {
        startTransition(async () => {
          const response = await fetch("/api/auth/refresh", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ platform }),
          });

          if (!response.ok) {
            throw new Error("Failed to refresh tokens");
          }

          const result = await response.json();

          log.info("Token refresh completed", result);

          // Refresh the status
          await fetchRefreshStatus();
        });
      } catch (error) {
        log.error("Failed to refresh tokens", { platform, error });
      }
    },
    [fetchRefreshStatus],
  );

  const handleDisconnectPlatform = useCallback(
    async (credentialId: string) => {
      try {
        startTransition(async () => {
          // TODO: Implement disconnect API
          const response = await fetch(`/api/auth/disconnect/${credentialId}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            throw new Error("Failed to disconnect platform");
          }

          await fetchRefreshStatus();
          onClose();
        });
      } catch (error) {
        log.error("Failed to disconnect platform", { credentialId, error });
      }
    },
    [fetchRefreshStatus, onClose],
  );

  const openDisconnectModal = useCallback(
    (credential: PlatformCredential) => {
      setSelectedCredential(credential);
      onOpen();
    },
    [onOpen],
  );

  const formatLastSync = useCallback((lastSync?: string) => {
    if (!lastSync) return "Never";

    return new Intl.RelativeTimeFormat("ko", { numeric: "auto" }).format(
      Math.round(
        (new Date(lastSync).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      ),
      "day",
    );
  }, []);

  const getCredentialStatus = useCallback(
    (credential: PlatformCredential) => {
      if (credential.hasError) {
        return {
          color: "danger" as const,
          label: dict.integrations.status.error,
          icon: FaExclamationTriangle,
        };
      }
      if (credential.needsRefresh) {
        return {
          color: "warning" as const,
          label: dict.integrations.status.needsRefresh,
          icon: FaClock,
        };
      }
      if (credential.isActive) {
        return {
          color: "success" as const,
          label: dict.integrations.status.connected,
          icon: FaCheckCircle,
        };
      }

      return {
        color: "default" as const,
        label: dict.integrations.status.inactive,
        icon: FaClock,
      };
    },
    [dict],
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-default-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <div className="space-y-3">
                <div className="h-6 bg-default-200 rounded animate-pulse" />
                <div className="h-4 bg-default-200 rounded animate-pulse" />
                <div className="h-10 bg-default-200 rounded animate-pulse" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">
            {dict.integrations.management.title}
          </h2>
          <p className="text-default-500 mt-1">
            {dict.integrations.management.subtitle}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            color="primary"
            isLoading={isPending}
            startContent={
              <FaSync className={isPending ? "animate-spin" : ""} />
            }
            variant="flat"
            onPress={() => handleRefreshTokens()}
          >
            {dict.integrations.management.refreshAll}
          </Button>
          <Button
            color="primary"
            startContent={<FaSync />}
            variant="flat"
            onPress={fetchRefreshStatus}
          >
            {dict.integrations.management.refresh}
          </Button>
        </div>
      </div>

      {/* Service Status */}
      {refreshStatus && (
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">
                  {dict.integrations.management.tokenRefreshService}
                </h3>
                <p className="text-sm text-default-500">
                  {dict.integrations.management.tokenRefreshDescription}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Chip
                  color={
                    refreshStatus.refreshService.isRunning
                      ? "success"
                      : "danger"
                  }
                  variant="flat"
                >
                  {refreshStatus.refreshService.isRunning
                    ? dict.integrations.management.running
                    : dict.integrations.management.stopped}
                </Chip>
                <div className="text-right text-sm">
                  <div>
                    {dict.integrations.management.totalIntegrations.replace(
                      "{{count}}",
                      refreshStatus.totalCredentials.toString(),
                    )}
                  </div>
                  <div className="text-warning">
                    {dict.integrations.management.needRefresh.replace(
                      "{{count}}",
                      refreshStatus.credentialsNeedingRefresh.toString(),
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Connected Platforms */}
      {refreshStatus && refreshStatus.credentials.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">
            {dict.integrations.management.connectedPlatforms}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {refreshStatus.credentials.map((credential) => {
              const Icon =
                PlatformIcons[
                  credential.platform.toUpperCase() as keyof typeof PlatformIcons
                ];
              const status = getCredentialStatus(credential);

              return (
                <Card key={credential.id} className="p-4">
                  <CardBody className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon
                          className="w-8 h-8"
                          color={`var(--heroui-colors-${PlatformColors[credential.platform.toUpperCase() as keyof typeof PlatformColors]})`}
                        />
                        <div>
                          <h4 className="font-semibold">
                            {getPlatformDisplayName(credential.platform)}
                          </h4>
                          <p className="text-sm text-default-500">
                            {credential.accountName}
                          </p>
                        </div>
                      </div>
                      <Chip
                        color={status.color}
                        startContent={<status.icon className="w-3 h-3" />}
                        variant="flat"
                      >
                        {status.label}
                      </Chip>
                    </div>

                    {credential.hasError && (
                      <div className="bg-danger-50 border border-danger-200 rounded-lg p-3">
                        <p className="text-sm text-danger-800">
                          {credential.errorMessage}
                        </p>
                      </div>
                    )}

                    <div className="text-xs text-default-400 space-y-1">
                      <div>
                        {dict.integrations.management.lastSyncTime.replace(
                          "{{time}}",
                          formatLastSync(credential.lastSync),
                        )}
                      </div>
                      {credential.expiresAt && (
                        <div>
                          {dict.integrations.management.tokenExpiry}{" "}
                          {new Date(credential.expiresAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        color="primary"
                        isLoading={isPending}
                        size="sm"
                        startContent={<FaSync />}
                        variant="flat"
                        onPress={() => handleRefreshTokens(credential.platform)}
                      >
                        {dict.integrations.management.refresh}
                      </Button>
                      <Button
                        color="danger"
                        size="sm"
                        startContent={<FaTrash />}
                        variant="flat"
                        onPress={() => openDisconnectModal(credential)}
                      >
                        {dict.integrations.management.disconnect}
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Platforms */}
      <div>
        <h3 className="text-lg font-semibold mb-4">
          {dict.integrations.management.platformIntegration}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(PlatformIcons).map(([platform, Icon]) => {
            const platformType = platform as PlatformType;
            const isConnected = refreshStatus?.credentials.some(
              (cred) => cred.platform === platformType,
            );
            const isSupported = isPlatformOAuthSupported(platformType);

            return (
              <Card key={platform} className="p-4">
                <CardBody className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Icon
                      className="w-8 h-8"
                      color={`var(--heroui-colors-${PlatformColors[platformType.toUpperCase() as keyof typeof PlatformColors]})`}
                    />
                    <div>
                      <h4 className="font-semibold">
                        {getPlatformDisplayName(platformType)}
                      </h4>
                      <p className="text-sm text-default-500">
                        {isSupported
                          ? dict.integrations.management.oauthSupported
                          : dict.integrations.management.manualOnly}
                      </p>
                    </div>
                  </div>

                  {isConnected ? (
                    <Chip color="success" variant="flat">
                      {dict.integrations.management.connected}
                    </Chip>
                  ) : (
                    <Button
                      fullWidth
                      color="primary"
                      isDisabled={!isSupported}
                      startContent={<FaPlus />}
                      variant="flat"
                      onPress={() => handleConnectPlatform(platformType)}
                    >
                      {isSupported
                        ? dict.integrations.connect
                        : dict.integrations.management.comingSoon}
                    </Button>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Disconnect Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>
            {dict.integrations.management.disconnectModal.title}
          </ModalHeader>
          <ModalBody>
            {selectedCredential && (
              <div>
                <p className="mb-4">
                  {dict.integrations.management.disconnectModal.confirmText}{" "}
                  {dict.integrations.management.disconnectModal.platformName
                    .replace(
                      "{{platform}}",
                      getPlatformDisplayName(selectedCredential.platform),
                    )
                    .replace("{{account}}", selectedCredential.accountName)}
                </p>
                <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
                  <p className="text-sm text-warning-800">
                    {dict.integrations.management.disconnectModal.warning}
                  </p>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>
              {dict.integrations.management.disconnectModal.cancel}
            </Button>
            <Button
              color="danger"
              isLoading={isPending}
              onPress={() =>
                selectedCredential &&
                handleDisconnectPlatform(selectedCredential.id)
              }
            >
              {dict.integrations.management.disconnectModal.disconnect}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
