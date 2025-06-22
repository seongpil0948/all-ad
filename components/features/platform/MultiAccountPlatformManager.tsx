"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Switch } from "@heroui/switch";
import { Chip } from "@heroui/chip";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { useDisclosure } from "@heroui/modal";
import { useAsyncList } from "@react-stately/data";
import { FaPlus, FaSync, FaExclamationTriangle } from "react-icons/fa";

import { PlatformCredentialForm } from "./PlatformCredentialForm";
import { CoupangManualCampaignManager } from "./coupang/CoupangManualCampaignManager";

import { OAuthClient } from "@/lib/oauth/oauth-client";
import { getOAuthConfig } from "@/lib/oauth/platform-configs.client";
import { PlatformType } from "@/types";
import { CredentialValues } from "@/types/credentials.types";
import { Database } from "@/types/supabase.types";
import { platformConfig } from "@/utils/platform-config";
import {
  TableActions,
  SectionHeader,
  InfiniteScrollTable,
  InfiniteScrollTableColumn,
} from "@/components/common";

type PlatformCredential =
  Database["public"]["Tables"]["platform_credentials"]["Row"];

interface MultiAccountPlatformManagerProps {
  credentials: PlatformCredential[];
  onSave: (
    platform: PlatformType,
    credentials: CredentialValues,
  ) => Promise<void>;
  onDelete: (credentialId: string) => Promise<void>;
  onToggle: (credentialId: string, isActive: boolean) => Promise<void>;
  teamId: string;
  userId: string;
}

const ITEMS_PER_PAGE = 10;

// Table columns definition
const columns: InfiniteScrollTableColumn<PlatformCredential>[] = [
  { key: "name", label: "계정명" },
  { key: "accountId", label: "계정 ID" },
  { key: "status", label: "상태" },
  { key: "lastSync", label: "마지막 동기화" },
  { key: "actions", label: "액션" },
];

export function MultiAccountPlatformManager({
  credentials,
  onSave,
  onDelete,
  onToggle,
  teamId,
  userId,
}: MultiAccountPlatformManagerProps) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [expandedPlatforms, setExpandedPlatforms] = useState<Set<PlatformType>>(
    new Set(),
  );
  const [hasMoreItems, setHasMoreItems] = useState<
    Record<PlatformType, boolean>
  >({} as Record<PlatformType, boolean>);
  const [tokenStatus, setTokenStatus] = useState<
    Record<string, "valid" | "invalid" | "checking">
  >({});
  const [reAuthLoading, setReAuthLoading] = useState<Set<string>>(new Set());

  // Create async list for a platform
  const createPlatformList = (platform: PlatformType) => {
    return useAsyncList<PlatformCredential>({
      async load({ cursor }) {
        const platformCreds = credentials.filter(
          (c) => c.platform === platform,
        );
        const start = cursor ? parseInt(cursor) : 0;
        const items = platformCreds.slice(start, start + ITEMS_PER_PAGE);

        const hasMore = start + ITEMS_PER_PAGE < platformCreds.length;

        setHasMoreItems((prev) => ({ ...prev, [platform]: hasMore }));

        return {
          items,
          cursor: hasMore ? String(start + ITEMS_PER_PAGE) : undefined,
        };
      },
      getKey: (item) => item.id,
    });
  };

  // Infinite scroll setup for each platform
  const platformLists = {
    facebook: createPlatformList("facebook"),
    google: createPlatformList("google"),
    kakao: createPlatformList("kakao"),
    naver: createPlatformList("naver"),
    coupang: createPlatformList("coupang"),
  };

  // Reload lists when credentials change
  useEffect(() => {
    Object.values(platformLists).forEach((list) => list.reload());
    checkTokensStatus();
  }, [credentials.length]);

  // Check token status for OAuth platforms
  const checkTokensStatus = async () => {
    for (const credential of credentials) {
      if (
        (credential.platform === "google" ||
          credential.platform === "facebook" ||
          credential.platform === "kakao") &&
        credential.is_active
      ) {
        setTokenStatus((prev) => ({
          ...prev,
          [credential.id]: "checking",
        }));

        try {
          const response = await fetch(
            `/api/auth/refresh?platform=${credential.platform}&accountId=${credential.account_id}`,
          );
          const result = await response.json();

          setTokenStatus((prev) => ({
            ...prev,
            [credential.id]: result.success ? "valid" : "invalid",
          }));
        } catch (error) {
          setTokenStatus((prev) => ({
            ...prev,
            [credential.id]: "invalid",
          }));
        }
      }
    }
  };

  const handleAddAccount = (platform: PlatformType) => {
    setSelectedPlatform(platform);
    onOpen();
  };

  const handleOAuthConnect = async (
    platform: PlatformType,
    credentials: CredentialValues,
  ) => {
    await onSave(platform, credentials);

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
    const state = JSON.stringify({
      userId,
      teamId,
      accountId: credentials.account_id || undefined,
    });
    const authUrl = oauthClient.getAuthorizationUrl(state);

    window.location.href = authUrl;
  };

  const handleReAuthenticate = async (credential: PlatformCredential) => {
    setReAuthLoading((prev) => new Set([...prev, credential.id]));

    try {
      if (!credential.credentials) {
        throw new Error("Credential data not found");
      }

      const credentialData = credential.credentials as any;
      const credentialValues: CredentialValues = {
        client_id: credentialData.client_id,
        client_secret: credentialData.client_secret,
        account_id: credential.account_id || undefined,
      };

      await handleOAuthConnect(
        credential.platform as PlatformType,
        credentialValues,
      );
    } catch (error) {
      console.error("Re-authentication failed:", error);
      // Keep the loading state until page reload from OAuth
    }
  };

  const handleSave = async (credentials: CredentialValues) => {
    if (!selectedPlatform) return;

    setIsLoading(true);
    try {
      const platformInfo = platformConfig[selectedPlatform];

      // Ensure is_active is set to true for new credentials
      const credentialsWithActiveStatus = {
        ...credentials,
        is_active: true,
      };

      if (
        (selectedPlatform === "facebook" ||
          selectedPlatform === "google" ||
          selectedPlatform === "kakao") &&
        platformInfo.supportsOAuth
      ) {
        await handleOAuthConnect(selectedPlatform, credentialsWithActiveStatus);
      } else {
        await onSave(selectedPlatform, credentialsWithActiveStatus);
        onOpenChange();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlatformExpanded = (platform: PlatformType) => {
    const newExpanded = new Set(expandedPlatforms);

    if (newExpanded.has(platform)) {
      newExpanded.delete(platform);
    } else {
      newExpanded.add(platform);
    }
    setExpandedPlatforms(newExpanded);
  };

  const getCredentialsForPlatform = (platform: PlatformType) => {
    return credentials.filter((c) => c.platform === platform);
  };

  // Render cell content
  const renderCell = (item: PlatformCredential, columnKey: string) => {
    const isOAuthPlatform =
      item.platform === "google" ||
      item.platform === "facebook" ||
      item.platform === "kakao";
    const currentTokenStatus = tokenStatus[item.id];
    const isReAuthLoading = reAuthLoading.has(item.id);

    switch (columnKey) {
      case "name":
        return (
          <div className="flex items-center gap-2">
            <span>{item.account_name || "이름 없음"}</span>
            {isOAuthPlatform && currentTokenStatus === "invalid" && (
              <Chip
                color="warning"
                size="sm"
                startContent={<FaExclamationTriangle size={12} />}
                variant="flat"
              >
                토큰 만료
              </Chip>
            )}
          </div>
        );
      case "accountId":
        return <span className="text-small">{item.account_id || "-"}</span>;
      case "status":
        return (
          <div className="flex items-center gap-2">
            <Switch
              isSelected={item.is_active || false}
              size="sm"
              onValueChange={(isActive) => onToggle(item.id, isActive)}
            />
            {isOAuthPlatform && currentTokenStatus === "checking" && (
              <span className="text-tiny text-default-400">확인 중...</span>
            )}
          </div>
        );
      case "lastSync":
        return (
          <span className="text-small text-default-500">
            {item.last_synced_at
              ? new Date(item.last_synced_at).toLocaleDateString()
              : "동기화 전"}
          </span>
        );
      case "actions": {
        const actions = [
          {
            label: "삭제",
            color: "danger" as const,
            variant: "light" as const,
            onPress: () => onDelete(item.id),
          },
        ];

        return (
          <div className="flex items-center gap-2">
            <TableActions actions={actions} />
            {isOAuthPlatform && currentTokenStatus === "invalid" && (
              <Button
                color="warning"
                isLoading={isReAuthLoading}
                size="sm"
                startContent={<FaSync size={12} />}
                variant="flat"
                onPress={() => handleReAuthenticate(item)}
              >
                재연동
              </Button>
            )}
          </div>
        );
      }
      default:
        return null;
    }
  };

  const renderAccountsTable = (platform: PlatformType) => {
    const list = platformLists[platform as keyof typeof platformLists];

    if (!list) return null;

    return (
      <InfiniteScrollTable
        aria-label={`${platformConfig[platform].name} 계정 목록`}
        columns={columns}
        emptyContent="연동된 계정이 없습니다"
        hasMore={hasMoreItems[platform] || false}
        isLoading={list.isLoading && list.items.length === 0}
        items={list}
        maxHeight="300px"
        renderCell={renderCell}
        onLoadMore={() => list.loadMore()}
      />
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <SectionHeader title="플랫폼 계정 관리" />
        </CardHeader>
        <CardBody className="gap-4">
          {(Object.keys(platformConfig) as PlatformType[]).map((platform) => {
            const config = platformConfig[platform];
            const platformCredentials = getCredentialsForPlatform(platform);
            const isExpanded = expandedPlatforms.has(platform);
            const Icon = config.icon;

            return (
              <Card key={platform} className="border">
                <CardBody>
                  <div className="flex items-center justify-between w-full">
                    <button
                      className="flex items-center gap-3 flex-1 text-left bg-transparent border-none p-0 cursor-pointer"
                      type="button"
                      onClick={() => togglePlatformExpanded(platform)}
                    >
                      <div
                        className={`p-2 rounded-lg text-white ${config.bgColor}`}
                      >
                        <Icon size={24} />
                      </div>
                      <div>
                        <h4 className="font-medium">{config.name}</h4>
                        <div className="flex gap-2 mt-1">
                          {platformCredentials.length > 0 ? (
                            <Chip color="success" size="sm" variant="flat">
                              {platformCredentials.length}개 계정 연동됨
                            </Chip>
                          ) : (
                            <Chip color="default" size="sm" variant="flat">
                              미연동
                            </Chip>
                          )}
                        </div>
                      </div>
                    </button>

                    <Button
                      color={config.color}
                      size="sm"
                      startContent={<FaPlus size={14} />}
                      variant="solid"
                      onPress={() => {
                        handleAddAccount(platform);
                      }}
                    >
                      계정 추가
                    </Button>
                  </div>

                  {isExpanded && platformCredentials.length > 0 && (
                    <div className="mt-4">{renderAccountsTable(platform)}</div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </CardBody>
      </Card>

      {/* Coupang Manual Campaign Manager */}
      {credentials.find(
        (c) => c.platform === "coupang" && (c.is_active || false),
      ) && <CoupangManualCampaignManager teamId={teamId} />}

      <Modal isOpen={isOpen} size="2xl" onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {selectedPlatform && platformConfig[selectedPlatform].name} 계정
                추가
              </ModalHeader>
              <ModalBody>
                {selectedPlatform && (
                  <PlatformCredentialForm
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
