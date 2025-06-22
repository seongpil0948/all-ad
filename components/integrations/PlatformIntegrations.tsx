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
        `${getPlatformDisplayName(platform.toUpperCase() as PlatformType)} 연결 성공!\n계정: ${decodeURIComponent(account)}`,
      );
      // Clear URL params
      window.history.replaceState({}, "", window.location.pathname);
      // Refresh data
      fetchRefreshStatus();
    } else if (error && platform) {
      let errorMessage = "플랫폼 연결에 실패했습니다.";

      switch (error) {
        case "oauth_cancelled":
          errorMessage = "OAuth 인증이 취소되었습니다.";
          break;
        case "invalid_oauth_response":
          errorMessage = "OAuth 응답이 올바르지 않습니다.";
          break;
        case "team_not_found":
          errorMessage = "팀을 찾을 수 없습니다.";
          break;
        case "oauth_failed":
          errorMessage = message
            ? decodeURIComponent(message)
            : "OAuth 인증에 실패했습니다.";
          break;
        default:
          errorMessage = message ? decodeURIComponent(message) : errorMessage;
      }

      log.error("Platform connection failed", { error, platform, message });
      // Show error notification
      alert(
        `${getPlatformDisplayName(platform.toUpperCase() as PlatformType)} 연결 실패!\n${errorMessage}`,
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

  const getCredentialStatus = useCallback((credential: PlatformCredential) => {
    if (credential.hasError) {
      return {
        color: "danger" as const,
        label: "오류",
        icon: FaExclamationTriangle,
      };
    }
    if (credential.needsRefresh) {
      return { color: "warning" as const, label: "갱신 필요", icon: FaClock };
    }
    if (credential.isActive) {
      return {
        color: "success" as const,
        label: "연결됨",
        icon: FaCheckCircle,
      };
    }

    return { color: "default" as const, label: "비활성", icon: FaClock };
  }, []);

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
          <h2 className="text-2xl font-bold">플랫폼 연동 관리</h2>
          <p className="text-default-500 mt-1">
            광고 플랫폼을 연동하여 통합 대시보드에서 관리하세요
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
            전체 갱신
          </Button>
          <Button
            color="primary"
            startContent={<FaSync />}
            variant="flat"
            onPress={fetchRefreshStatus}
          >
            새로고침
          </Button>
        </div>
      </div>

      {/* Service Status */}
      {refreshStatus && (
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">토큰 갱신 서비스</h3>
                <p className="text-sm text-default-500">
                  자동으로 만료되는 토큰을 갱신합니다
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
                    ? "실행 중"
                    : "중지됨"}
                </Chip>
                <div className="text-right text-sm">
                  <div>전체 연동: {refreshStatus.totalCredentials}개</div>
                  <div className="text-warning">
                    갱신 필요: {refreshStatus.credentialsNeedingRefresh}개
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
          <h3 className="text-lg font-semibold mb-4">연동된 플랫폼</h3>
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
                        마지막 동기화: {formatLastSync(credential.lastSync)}
                      </div>
                      {credential.expiresAt && (
                        <div>
                          토큰 만료:{" "}
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
                        갱신
                      </Button>
                      <Button
                        color="danger"
                        size="sm"
                        startContent={<FaTrash />}
                        variant="flat"
                        onPress={() => openDisconnectModal(credential)}
                      >
                        연결 해제
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
        <h3 className="text-lg font-semibold mb-4">플랫폼 연동</h3>
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
                        {isSupported ? "OAuth 지원" : "수동 연동만 가능"}
                      </p>
                    </div>
                  </div>

                  {isConnected ? (
                    <Chip color="success" variant="flat">
                      연결됨
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
                      {isSupported ? "연결하기" : "지원 예정"}
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
          <ModalHeader>플랫폼 연결 해제</ModalHeader>
          <ModalBody>
            {selectedCredential && (
              <div>
                <p className="mb-4">
                  정말로{" "}
                  <strong>
                    {getPlatformDisplayName(selectedCredential.platform)}
                  </strong>
                  ({selectedCredential.accountName}) 연결을 해제하시겠습니까?
                </p>
                <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
                  <p className="text-sm text-warning-800">
                    연결을 해제하면 해당 플랫폼의 데이터를 더 이상 동기화할 수
                    없습니다. 다시 연결하려면 OAuth 인증을 다시 진행해야 합니다.
                  </p>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>
              취소
            </Button>
            <Button
              color="danger"
              isLoading={isPending}
              onPress={() =>
                selectedCredential &&
                handleDisconnectPlatform(selectedCredential.id)
              }
            >
              연결 해제
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
