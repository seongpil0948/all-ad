"use client";

import { useCallback } from "react";
import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { FaSync } from "react-icons/fa";
import { addToast } from "@heroui/toast";

import { usePlatformSync, useMultiPlatformSync } from "@/hooks/useCampaigns";
import { usePlatformStore } from "@/stores";
import { PlatformType } from "@/types";
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
  const { sync, isSyncing: isSingleSyncing } = usePlatformSync();

  // 활성 플랫폼 필터링
  const activePlatforms = credentials
    .filter((c) => c.is_active)
    .map((c) => c.platform as PlatformType);

  // 동기화할 플랫폼 결정
  const targetPlatforms = platforms || activePlatforms;

  const { syncAll, isSyncing: isMultiSyncing } =
    useMultiPlatformSync(targetPlatforms);

  const isSyncing = isSingleSyncing || isMultiSyncing;

  const handleSync = useCallback(async () => {
    if (targetPlatforms.length === 0) {
      addToast({
        title: "오류",
        description: "동기화할 활성 플랫폼이 없습니다",
        color: "danger",
      });

      return;
    }

    try {
      if (targetPlatforms.length === 1) {
        // 단일 플랫폼 동기화
        await sync({ platform: targetPlatforms[0] });
      } else {
        // 다중 플랫폼 동기화
        await syncAll();
      }

      addToast({
        title: "성공",
        description: `${targetPlatforms.length}개 플랫폼 동기화가 완료되었습니다`,
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
  }, [targetPlatforms, sync, syncAll]);

  const buttonContent = (
    <Button
      className={className}
      color={color}
      isDisabled={targetPlatforms.length === 0}
      isLoading={isSyncing}
      size={size}
      startContent={!isSyncing && <FaSync />}
      variant={variant}
      onPress={handleSync}
    >
      {showLabel &&
        (isSyncing
          ? "동기화 중..."
          : targetPlatforms.length === 1
            ? `${targetPlatforms[0]} 동기화`
            : `${targetPlatforms.length}개 플랫폼 동기화`)}
    </Button>
  );

  if (targetPlatforms.length === 0) {
    return (
      <Tooltip content="활성화된 플랫폼이 없습니다" placement="bottom">
        {buttonContent}
      </Tooltip>
    );
  }

  return (
    <Tooltip
      content={`${targetPlatforms.join(", ")} 플랫폼 동기화`}
      placement="bottom"
    >
      {buttonContent}
    </Tooltip>
  );
}
