import clsx from "clsx";
import React, { type ElementType } from "react";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  max?: "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "7xl";
  padded?: boolean;
  as?: ElementType;
  "data-testid"?: string;
}

export function Container({
  children,
  className,
  max = "7xl",
  padded = true,
  as: Component = "div",
  ...rest
}: ContainerProps) {
  const maxClass = `max-w-${max}`;
  return (
    <Component
      className={clsx(
        "mx-auto",
        maxClass,
        padded && "px-4 sm:px-6 lg:px-8",
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}
