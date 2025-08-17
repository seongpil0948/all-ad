import React from "react";
import clsx from "clsx";

interface AutoGridProps {
  children: React.ReactNode;
  minItemWidth?: number; // px
  gap?: string; // tailwind gap classes or CSS value
  className?: string;
  role?: string;
  "data-testid"?: string;
}

export function AutoGrid({
  children,
  minItemWidth = 240,
  gap = "gap-4 sm:gap-6",
  className,
  role,
  ...rest
}: AutoGridProps) {
  return (
    <div
      className={clsx("grid", gap, className)}
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}px, 1fr))`,
      }}
      role={role || "grid"}
      {...rest}
    >
      {children}
    </div>
  );
}
