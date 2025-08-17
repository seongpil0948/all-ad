"use client";

import { useCallback, useState } from "react";
import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { FaSync } from "react-icons/fa";
import { addToast } from "@heroui/toast";

import { usePlatformStore } from "@/stores";
import { PlatformType } from "@/types";
import log from "@/utils/logger";
import { useDictionary } from "@/hooks/use-dictionary";

interface SyncButtonProps {
  size?: "sm" | "md" | "lg";
  variant?: "solid" | "flat" | "ghost" | "light" | "bordered";
  color?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger";
  showLabel?: boolean;
  className?: string;
  platforms?: PlatformType[]; // 특정 플랫폼만 동기화
}

export function SyncButton({
  size = "md",
  variant = "flat",
  color = "primary",
  showLabel = true,
  className,
  platforms,
}: SyncButtonProps) {
  const credentials = usePlatformStore((state) => state.credentials);
  const { dictionary: dict } = useDictionary();
  const [isSyncing, setIsSyncing] = useState(false);

  // 활성 플랫폼 필터링
  const activePlatforms = credentials
    .filter((c) => c.is_active)
    .map((c) => c.platform as PlatformType);

  // 동기화할 플랫폼 결정
  const targetPlatforms = platforms || activePlatforms;

  const handleSync = useCallback(async () => {
    if (targetPlatforms.length === 0) {
      addToast({
        title: dict.common.error,
        description: dict.dashboard.sync.noActivePlatforms,
        color: "danger",
      });

      return;
    }

    try {
      setIsSyncing(true);
      // Fire sync for all target platforms in parallel
      await Promise.all(
        targetPlatforms.map((p) =>
          fetch(`/api/sync/${p}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }).then((r) => {
            if (!r.ok) throw new Error(`Failed to sync ${p}`);
          }),
        ),
      );

      addToast({
        title: dict.common.success,
        description: (dict.dashboard.sync.syncPlatforms as string).replace(
          "{{count}}",
          String(targetPlatforms.length),
        ),
        color: "success",
      });
    } catch (error) {
      log.error(`Sync error: ${JSON.stringify(error)}`);
      addToast({
        title: dict.common.error,
        description: dict.dashboard.sync.errorDescription,
        color: "danger",
      });
    } finally {
      setIsSyncing(false);
    }
  }, [targetPlatforms, dict]);

  const buttonContent = (
    <Button
      className={className}
      color={color}
      isDisabled={targetPlatforms.length === 0}
      isLoading={isSyncing}
      size={size}
      startContent={!isSyncing && <FaSync aria-hidden={true} />}
      variant={variant}
      onPress={handleSync}
      data-testid="sync-button"
      aria-label={
        isSyncing
          ? dict.dashboard.sync.syncing
          : (dict.dashboard.sync.syncPlatforms as string).replace(
              "{{count}}",
              String(targetPlatforms.length),
            )
      }
    >
      {showLabel &&
        (isSyncing
          ? dict.dashboard.sync.syncing
          : (dict.dashboard.sync.syncPlatforms as string).replace(
              "{{count}}",
              String(targetPlatforms.length),
            ))}
    </Button>
  );

  if (targetPlatforms.length === 0) {
    return (
      <Tooltip
        content={dict.dashboard.sync.noActivePlatforms}
        placement={"bottom"}
        data-testid="sync-button-tooltip-disabled"
      >
        {buttonContent}
      </Tooltip>
    );
  }

  return (
    <Tooltip
      content={(dict.dashboard.sync.syncPlatforms as string).replace(
        "{{count}}",
        String(targetPlatforms.length),
      )}
      placement={"bottom"}
      data-testid="sync-button-tooltip"
    >
      {buttonContent}
    </Tooltip>
  );
}
