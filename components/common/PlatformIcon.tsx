"use client";

import { memo } from "react";

import { platformConfig } from "@/constants/platform-config";
import { PlatformType } from "@/types";

interface PlatformIconProps {
  platform: PlatformType;
  size?: number;
  className?: string;
  showBackground?: boolean;
  "aria-label"?: string;
}

function PlatformIconComponent({
  platform,
  size = 24,
  className = "",
  showBackground = false,
  "aria-label": ariaLabel,
}: PlatformIconProps) {
  const config = platformConfig[platform];
  const Icon = config.icon;
  const defaultAriaLabel =
    ariaLabel || `${config.name || platform} platform icon`;

  if (showBackground) {
    return (
      <div
        className={`p-2 rounded-lg text-white ${config.bgColor} ${className}`}
        data-testid="platform-icon"
        role="img"
        aria-label={defaultAriaLabel}
      >
        <Icon size={size} aria-hidden={true} />
      </div>
    );
  }

  return (
    <Icon
      className={className}
      size={size}
      data-testid="platform-icon"
      role="img"
      aria-label={defaultAriaLabel}
    />
  );
}

export const PlatformIcon = memo(PlatformIconComponent);
