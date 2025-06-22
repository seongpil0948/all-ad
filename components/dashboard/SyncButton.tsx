"use client";

import { useCallback, useMemo } from "react";
import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { FaSync } from "react-icons/fa";
import { addToast } from "@heroui/toast";
import { useShallow } from "zustand/shallow";

import { usePlatformStore } from "@/stores";
import log from "@/utils/logger";

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
        title: "오류",
        description: "동기화할 활성 플랫폼이 없습니다",
        color: "danger",
        promise: new Promise((resolve) => setTimeout(resolve, 2000)),
      });

      return;
    }

    try {
      await syncAllPlatforms();
      addToast({
        title: "성공",
        description: "모든 플랫폼 동기화가 완료되었습니다",
        color: "success",
      });
    } catch (error) {
      log.error(`Sync error: ${JSON.stringify(error)}`);
      addToast({
        title: "오류",
        description: "동기화 중 오류가 발생했습니다",
        color: "danger",
      });
    }
  }, [activeCredentials.length, syncAllPlatforms]);

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
      {showLabel && (isSyncing ? "동기화 중..." : "전체 동기화")}
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
      <Tooltip content="활성화된 플랫폼이 없습니다" placement="bottom">
        {buttonContent}
      </Tooltip>
    );
  }

  return (
    <Tooltip
      content={`${activeCredentials.length}개 플랫폼 동기화`}
      placement="bottom"
    >
      {buttonContent}
    </Tooltip>
  );
}
