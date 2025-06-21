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
import { FaPlus } from "react-icons/fa";

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
  }, [credentials.length]);

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

  const handleSave = async (credentials: CredentialValues) => {
    if (!selectedPlatform) return;

    setIsLoading(true);
    try {
      const platformInfo = platformConfig[selectedPlatform];

      if (
        (selectedPlatform === "facebook" ||
          selectedPlatform === "google" ||
          selectedPlatform === "kakao") &&
        platformInfo.supportsOAuth
      ) {
        await handleOAuthConnect(selectedPlatform, credentials);
      } else {
        await onSave(selectedPlatform, credentials);
      }

      onOpenChange();
      if (selectedPlatform === "facebook" || selectedPlatform === "google") {
        return;
      }
      await onSave(selectedPlatform, credentials);
      onOpenChange();
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
    switch (columnKey) {
      case "name":
        return <span>{item.account_name || "이름 없음"}</span>;
      case "accountId":
        return <span className="text-small">{item.account_id || "-"}</span>;
      case "status":
        return (
          <Switch
            isSelected={item.is_active || false}
            size="sm"
            onValueChange={(isActive) => onToggle(item.id, isActive)}
          />
        );
      case "lastSync":
        return (
          <span className="text-small text-default-500">
            {item.last_synced_at
              ? new Date(item.last_synced_at).toLocaleDateString()
              : "동기화 전"}
          </span>
        );
      case "actions":
        return (
          <TableActions
            actions={[
              {
                label: "삭제",
                color: "danger",
                variant: "light",
                onPress: () => onDelete(item.id),
              },
            ]}
          />
        );
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
        items={list}
        renderCell={renderCell}
        emptyContent="연동된 계정이 없습니다"
        isLoading={list.isLoading && list.items.length === 0}
        hasMore={hasMoreItems[platform] || false}
        onLoadMore={() => list.loadMore()}
        maxHeight="300px"
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
