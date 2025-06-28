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
}

export function PlatformBadge({
  platform,
  showIcon = true,
  size = "sm",
  variant = "flat",
  className = "",
}: PlatformBadgeProps) {
  const config = getPlatformConfig(platform);
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showIcon && (
        <div className={`p-1 rounded ${config.bgColor}`}>
          {createElement(Icon, { className: `w-4 h-4 text-white` })}
        </div>
      )}
      <Chip color={config.color} size={size} variant={variant}>
        {config.name}
      </Chip>
    </div>
  );
}
