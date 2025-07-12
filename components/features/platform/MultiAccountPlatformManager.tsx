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

// OAuth imports removed - legacy OAuth implementation
import { PlatformType } from "@/types";
import { CredentialValues } from "@/types/credentials.types";
import { Database, Json } from "@/types/supabase.types";
import { platformConfig } from "@/utils/platform-config";
import { toast } from "@/utils/toast";
import log from "@/utils/logger";
import {
  TableActions,
  SectionHeader,
  InfiniteScrollTable,
  InfiniteScrollTableColumn,
} from "@/components/common";
import { useDictionary } from "@/hooks/use-dictionary";

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

export function MultiAccountPlatformManager({
  credentials,
  onSave,
  onDelete,
  onToggle,
  teamId,
  userId: _userId,
}: MultiAccountPlatformManagerProps) {
  const { dictionary: dict } = useDictionary();
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

  // Table columns definition
  const columns: InfiniteScrollTableColumn<PlatformCredential>[] = [
    { key: "name", label: dict.integrations.credentials.accountName },
    { key: "accountId", label: dict.integrations.credentials.accountId },
    { key: "status", label: dict.common.status },
    { key: "lastSync", label: dict.integrations.lastSync },
    { key: "actions", label: dict.common.actions },
  ];

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
    amazon: createPlatformList("amazon"),
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
          credential.platform === "kakao" ||
          credential.platform === "amazon") &&
        credential.is_active
      ) {
        setTokenStatus((prev) => ({
          ...prev,
          [credential.id]: "checking",
        }));

        try {
          // First check if token is valid
          const checkResponse = await fetch(
            `/api/auth/refresh?platform=${credential.platform}&accountId=${credential.account_id}`,
          );
          const checkResult = await checkResponse.json();

          if (!checkResult.success || !checkResult.hasValidToken) {
            // If token is invalid, try to refresh it
            log.info(
              `Token invalid for ${credential.account_name}, attempting refresh...`,
            );

            const refreshResponse = await fetch("/api/auth/refresh", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                platform: credential.platform,
                accountId: credential.account_id,
              }),
            });

            const refreshResult = await refreshResponse.json();

            setTokenStatus((prev) => ({
              ...prev,
              [credential.id]: refreshResult.success ? "valid" : "invalid",
            }));

            if (refreshResult.success) {
              log.info(
                `Token refreshed successfully for ${credential.account_name}`,
              );
            } else {
              log.error(
                `Token refresh failed for ${credential.account_name}:`,
                refreshResult.error,
              );
            }
          } else {
            setTokenStatus((prev) => ({
              ...prev,
              [credential.id]: "valid",
            }));
          }
        } catch (error) {
          log.error(
            `Error checking/refreshing token for ${credential.account_name}:`,
            error,
          );
          setTokenStatus((prev) => ({
            ...prev,
            [credential.id]: "invalid",
          }));
        }
      }
    }
  };

  const handleAddAccount = (platform: PlatformType) => {
    const config = platformConfig[platform];

    // For OAuth platforms, redirect to OAuth flow
    if (config.supportsOAuth) {
      // Use unified OAuth route
      const unifiedRoute = `/api/auth/oauth/${platform}`;

      // Legacy individual routes for fallback
      const oauthRoutes = {
        google: "/api/auth/google-ads",
        facebook: "/api/auth/facebook-ads",
        kakao: "/api/auth/kakao-ads",
        amazon: "/api/auth/amazon-ads",
        naver: "/api/auth/naver-ads",
      };

      const route =
        oauthRoutes[platform as keyof typeof oauthRoutes] || unifiedRoute;

      window.location.href = route;

      return;
    }

    // For API key platforms (Naver, Coupang), show the form modal
    setSelectedPlatform(platform);
    onOpen();
  };

  const handleOAuthConnect = async (
    platform: PlatformType,
    _credentials: CredentialValues,
  ) => {
    // For Google Ads, use simplified OAuth flow
    if (platform === "google") {
      // Redirect to OAuth flow directly
      window.location.href = "/api/auth/google-ads";

      return;
    }

    // For other OAuth platforms (Facebook, Kakao), handle accordingly
    // TODO: Implement OAuth flow for other platforms
    console.warn("OAuth connection needs to be implemented for", platform);
  };

  const handleReAuthenticate = async (credential: PlatformCredential) => {
    setReAuthLoading((prev) => new Set([...prev, credential.id]));

    try {
      // First try to refresh the token
      const refreshResponse = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platform: credential.platform,
          accountId: credential.account_id,
        }),
      });

      const refreshResult = await refreshResponse.json();

      if (refreshResult.success) {
        // Token refreshed successfully
        toast.success({
          title: dict.integrations.credentials.tokenRefreshSuccess,
          description:
            dict.integrations.credentials.tokenRefreshSuccessDesc.replace(
              "{{account}}",
              credential.account_name ?? "",
            ),
        });

        setTokenStatus((prev) => ({
          ...prev,
          [credential.id]: "valid",
        }));

        setReAuthLoading((prev) => {
          const newSet = new Set(prev);

          newSet.delete(credential.id);

          return newSet;
        });

        // Refresh the tokens status
        await checkTokensStatus();
      } else {
        // Token refresh failed, redirect to OAuth flow
        log.error(
          "Token refresh failed, redirecting to OAuth:",
          refreshResult.error,
        );

        const platform = credential.platform as PlatformType;

        if (platform === "google") {
          window.location.href = "/api/auth/google-ads";

          return;
        }

        // For other OAuth platforms
        await handleOAuthConnect(platform, credential);
      }
    } catch (error) {
      log.error("Re-authentication failed:", error);

      toast.error({
        title: dict.integrations.credentials.reAuthFailed,
        description: dict.integrations.credentials.reAuthFailedDesc,
      });

      setReAuthLoading((prev) => {
        const newSet = new Set(prev);

        newSet.delete(credential.id);

        return newSet;
      });
    }
  };

  const handleSave = async (formValues: Record<string, unknown>) => {
    if (!selectedPlatform) return;

    setIsLoading(true);
    try {
      const platformInfo = platformConfig[selectedPlatform];

      // Convert form values to CredentialValues format
      const credentials: CredentialValues = {
        access_token: null,
        account_id: `${selectedPlatform}_${Date.now()}`,
        account_name: platformInfo.name,
        created_at: new Date().toISOString(),
        created_by: _userId,
        credentials: formValues as { [key: string]: Json | undefined },
        data: null,
        expires_at: null,
        id: crypto.randomUUID(),
        is_active: true,
        last_synced_at: null,
        error_message: null,
        platform: selectedPlatform,
        refresh_token: null,
        scope: null,
        team_id: teamId,
        updated_at: new Date().toISOString(),
      };

      if (
        (selectedPlatform === "facebook" ||
          selectedPlatform === "google" ||
          selectedPlatform === "kakao") &&
        platformInfo.supportsOAuth
      ) {
        await handleOAuthConnect(selectedPlatform, credentials);
      } else {
        await onSave(selectedPlatform, credentials);
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
            <span>
              {item.account_name || dict.integrations.credentials.noName}
            </span>
            {isOAuthPlatform && currentTokenStatus === "invalid" && (
              <Chip
                color="warning"
                size="sm"
                startContent={<FaExclamationTriangle size={12} />}
                variant="flat"
              >
                {dict.integrations.credentials.tokenExpired}
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
              <span className="text-tiny text-default-400">
                {dict.integrations.credentials.checking}
              </span>
            )}
          </div>
        );
      case "lastSync":
        return (
          <span className="text-small text-default-500">
            {item.last_synced_at
              ? new Date(item.last_synced_at).toLocaleDateString()
              : dict.integrations.credentials.notSynced}
          </span>
        );
      case "actions": {
        const actions = [
          {
            label: dict.common.delete,
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
                {dict.integrations.reconnect}
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
        aria-label={`${platformConfig[platform].name} ${dict.integrations.credentials.accountList}`}
        columns={columns}
        emptyContent={dict.integrations.credentials.noAccounts}
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
          <SectionHeader
            title={dict.integrations.credentials.platformAccountManagement}
          />
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
                              {dict.integrations.credentials.accountsConnected.replace(
                                "{{count}}",
                                platformCredentials.length.toString(),
                              )}
                            </Chip>
                          ) : (
                            <Chip color="default" size="sm" variant="flat">
                              {dict.integrations.credentials.notConnected}
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
                      {dict.integrations.credentials.addAccount}
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
                {selectedPlatform &&
                  dict.integrations.credentials.addAccountTitle.replace(
                    "{{platform}}",
                    platformConfig[selectedPlatform].name,
                  )}
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
