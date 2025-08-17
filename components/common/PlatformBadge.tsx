import { Chip } from "@heroui/chip";
import { createElement } from "react";

import { PlatformType } from "@/types";
import { getPlatformConfig } from "@/utils/platform-config";

interface PlatformBadgeProps {
  platform: PlatformType;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
  variant?:
    | "solid"
    | "bordered"
    | "light"
    | "flat"
    | "faded"
    | "shadow"
    | "dot";
  className?: string;
  color?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger";
  radius?: "none" | "sm" | "md" | "lg" | "full";
  isDisabled?: boolean;
}

export function PlatformBadge({
  platform,
  showIcon = true,
  size = "sm",
  variant = "flat",
  className = "",
  color,
  radius = "md",
  isDisabled = false,
}: PlatformBadgeProps) {
  const config = getPlatformConfig(platform);
  const Icon = config.icon;

  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      data-testid="platform-badge"
      role="img"
      aria-label={`${config.name} platform badge`}
    >
      {showIcon && (
        <div
          className={`p-1 rounded ${config.bgColor}`}
          role="presentation"
          aria-hidden={true}
        >
          {createElement(Icon, { className: `w-4 h-4 text-white` })}
        </div>
      )}
      <Chip
        color={color || config.color}
        size={size}
        variant={variant}
        radius={radius}
        isDisabled={isDisabled}
        data-testid="platform-badge-chip"
        aria-label={`${config.name} platform`}
      >
        {config.name}
      </Chip>
    </div>
  );
}
