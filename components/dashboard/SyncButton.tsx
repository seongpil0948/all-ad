"use client";

import { useCallback, useMemo } from "react";
import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { FaSync } from "react-icons/fa";
import { addToast } from "@heroui/toast";
import { useShallow } from "zustand/shallow";

import { usePlatformStore } from "@/stores";
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
}

export function SyncButton({
  size = "md",
  variant = "flat",
  color = "primary",
  showLabel = true,
  className,
}: SyncButtonProps) {
  const { dictionary: dict } = useDictionary();

  // Defensive check to ensure sync dictionary is available
  if (!dict?.dashboard?.sync) {
    return null;
  }

  // Use useShallow to optimize re-renders
  const { credentials, syncAllPlatforms, syncProgress, isLoading } =
    usePlatformStore(
      useShallow((state) => ({
        credentials: state.credentials,
        syncAllPlatforms: state.syncAllPlatforms,
        syncProgress: state.syncProgress,
        isLoading: state.isLoading,
      })),
    );

  const activeCredentials = useMemo(
    () => credentials.filter((c) => c.is_active),
    [credentials],
  );

  const isSyncing = useMemo(
    () => Object.values(syncProgress).some((progress) => progress > 0),
    [syncProgress],
  );

  const handleSync = useCallback(async () => {
    if (activeCredentials.length === 0) {
      addToast({
        title: dict.dashboard.sync.error,
        description: dict.dashboard.sync.connectFirst,
        color: "danger",
        promise: new Promise((resolve) => setTimeout(resolve, 2000)),
      });

      return;
    }

    try {
      await syncAllPlatforms();
      addToast({
        title: dict.dashboard.sync.success,
        description: dict.dashboard.sync.successDescription,
        color: "success",
      });
    } catch (error) {
      log.error(`Sync error: ${JSON.stringify(error)}`);
      addToast({
        title: dict.dashboard.sync.error,
        description: dict.dashboard.sync.errorDescription,
        color: "danger",
      });
    }
  }, [activeCredentials.length, syncAllPlatforms, dict]);

  const syncProgressText = useMemo(() => {
    const progressValues = Object.entries(syncProgress)
      .filter(([_, progress]) => progress > 0)
      .map(([platform, progress]) => `${platform}: ${progress}%`);

    return progressValues.length > 0 ? progressValues.join(", ") : "";
  }, [syncProgress]);

  const buttonContent = (
    <Button
      className={className}
      color={color}
      isDisabled={activeCredentials.length === 0}
      isLoading={isLoading || isSyncing}
      size={size}
      startContent={!isLoading && !isSyncing && <FaSync />}
      variant={variant}
      onPress={handleSync}
    >
      {showLabel &&
        (isSyncing ? dict.dashboard.sync.syncing : dict.dashboard.sync.syncAll)}
    </Button>
  );

  if (isSyncing && syncProgressText) {
    return (
      <Tooltip content={syncProgressText} placement="bottom">
        {buttonContent}
      </Tooltip>
    );
  }

  if (activeCredentials.length === 0) {
    return (
      <Tooltip
        content={dict.dashboard.sync.noActivePlatforms}
        placement="bottom"
      >
        {buttonContent}
      </Tooltip>
    );
  }

  return (
    <Tooltip
      content={dict.dashboard.sync.syncPlatforms.replace(
        "{{count}}",
        activeCredentials.length.toString(),
      )}
      placement="bottom"
    >
      {buttonContent}
    </Tooltip>
  );
}
