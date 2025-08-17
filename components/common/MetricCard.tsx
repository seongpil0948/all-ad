import { Card, CardBody } from "@heroui/card";
import { cn } from "@heroui/theme";

interface MetricCardProps {
  label: string;
  value: string;
  change?: string;
  isNegative?: boolean;
  icon?: React.ReactNode;
  isLoading?: boolean;
  shadow?: "none" | "sm" | "md" | "lg";
  radius?: "none" | "sm" | "md" | "lg";
  className?: string;
  size?: "sm" | "md" | "lg";
  iconPosition?: "left" | "right" | "top";
  clickable?: boolean;
  onClick?: () => void;
}

export function MetricCard({
  label,
  value,
  change,
  isNegative,
  icon,
  isLoading = false,
  shadow = "sm",
  radius = "md",
  className,
  size = "md",
  iconPosition = "right",
  clickable = false,
  onClick,
}: MetricCardProps) {
  if (isLoading) {
    return (
      <Card
        className={className}
        shadow={shadow}
        radius={radius}
        data-testid="metric-card-skeleton"
      >
        <CardBody>
          <div className="animate-pulse">
            <div className="h-4 bg-default-200 rounded mb-2"></div>
            <div className="h-8 bg-default-300 rounded mb-2"></div>
            <div className="h-4 bg-default-200 rounded w-1/2"></div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        className,
        clickable && "cursor-pointer transition-colors hover:bg-default-50",
      )}
      shadow={shadow}
      radius={radius}
      data-testid="metric-card"
      role="region"
      aria-labelledby={`metric-${label.replace(/\s+/g, "-").toLowerCase()}`}
      onClick={clickable ? onClick : undefined}
    >
      <CardBody>
        <div
          className={`flex items-center justify-between mb-2 ${
            iconPosition === "top" ? "flex-col items-start gap-2" : ""
          }`}
        >
          <p
            id={`metric-${label.replace(/\s+/g, "-").toLowerCase()}`}
            className={`text-default-500 ${
              size === "sm"
                ? "text-xs"
                : size === "lg"
                  ? "text-base"
                  : "text-sm"
            }`}
          >
            {label}
          </p>
          {icon && iconPosition !== "left" && (
            <div
              className="text-default-400"
              role="presentation"
              aria-hidden={true}
            >
              {icon}
            </div>
          )}
        </div>
        <div
          className={`flex ${iconPosition === "left" ? "items-center gap-2" : ""}`}
        >
          {icon && iconPosition === "left" && (
            <div
              className="text-default-400"
              role="presentation"
              aria-hidden={true}
            >
              {icon}
            </div>
          )}
          <p
            className={`${
              size === "sm"
                ? "text-xl"
                : size === "lg"
                  ? "text-3xl"
                  : "text-2xl"
            } font-bold`}
            aria-label={`${label} value: ${value}`}
          >
            {value}
          </p>
        </div>
        {change && (
          <p
            className={cn(
              "text-sm",
              isNegative ? "text-danger" : "text-success",
            )}
            aria-label={`Change: ${change} ${isNegative ? "decrease" : "increase"}`}
          >
            {change}
          </p>
        )}
      </CardBody>
    </Card>
  );
}
