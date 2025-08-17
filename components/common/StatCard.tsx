import { Card, CardBody } from "@heroui/card";
import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number | ReactNode;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
  shadow?: "none" | "sm" | "md" | "lg";
  radius?: "none" | "sm" | "md" | "lg";
  isLoading?: boolean;
  size?: "sm" | "md" | "lg";
  clickable?: boolean;
  onClick?: () => void;
}

export function StatCard({
  label,
  value,
  className = "",
  labelClassName = "text-default-500 text-sm",
  valueClassName = "text-2xl font-bold",
  shadow = "sm",
  radius = "md",
  isLoading = false,
  size = "md",
  clickable = false,
  onClick,
}: StatCardProps) {
  if (isLoading) {
    return (
      <Card
        className={className}
        shadow={shadow}
        radius={radius}
        data-testid="stat-card"
      >
        <CardBody>
          <div className="animate-pulse">
            <div className="h-4 bg-default-200 rounded mb-2"></div>
            <div className="h-8 bg-default-300 rounded"></div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card
      className={`${className || ""} ${
        clickable ? "cursor-pointer transition-colors hover:bg-default-50" : ""
      }`}
      shadow={shadow}
      radius={radius}
      data-testid="stat-card"
      role="region"
      aria-labelledby={`stat-${label.replace(/\s+/g, "-").toLowerCase()}`}
      onClick={clickable ? onClick : undefined}
    >
      <CardBody>
        <p
          className={`${labelClassName} ${
            size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm"
          }`}
          id={`stat-${label.replace(/\s+/g, "-").toLowerCase()}`}
        >
          {label}
        </p>
        <div
          className={`${valueClassName} ${
            size === "sm" ? "text-xl" : size === "lg" ? "text-3xl" : "text-2xl"
          }`}
          aria-label={`${label}: ${value}`}
          data-testid={`stat-value-${label.replace(/\s+/g, "-").toLowerCase()}`}
        >
          {value}
        </div>
      </CardBody>
    </Card>
  );
}
