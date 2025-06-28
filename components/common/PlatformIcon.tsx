"use client";

import { memo } from "react";

import { platformConfig } from "@/constants/platform-config";
import { PlatformType } from "@/types";

interface PlatformIconProps {
  platform: PlatformType;
  size?: number;
  className?: string;
  showBackground?: boolean;
}

function PlatformIconComponent({
  platform,
  size = 24,
  className = "",
  showBackground = false,
}: PlatformIconProps) {
  const config = platformConfig[platform];
  const Icon = config.icon;

  if (showBackground) {
    return (
      <div
        className={`p-2 rounded-lg text-white ${config.bgColor} ${className}`}
      >
        <Icon size={size} />
      </div>
    );
  }

  return <Icon className={className} size={size} />;
}

export const PlatformIcon = memo(PlatformIconComponent);
