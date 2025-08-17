"use client";

import { Button } from "@heroui/button";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

import log from "@/utils/logger";
import { buttonVariants } from "@/utils/animations";

interface CTAButtonProps {
  text: string;
  path: string;
  action: string;
  className?: string;
  color?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger";
  variant?:
    | "solid"
    | "bordered"
    | "light"
    | "flat"
    | "faded"
    | "shadow"
    | "ghost";
  size?: "sm" | "md" | "lg";
  isDisabled?: boolean;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  fullWidth?: boolean;
  mobileFullWidth?: boolean;
}

export function CTAButton({
  text,
  path,
  action,
  className,
  color = "primary",
  variant = "solid",
  size = "lg",
  isDisabled = false,
  startContent,
  endContent,
  fullWidth = false,
  mobileFullWidth = true,
}: CTAButtonProps) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  const handleClick = () => {
    log.info("CTA Button clicked", {
      module: "CTAButton",
      action,
      targetPath: path,
    });
    router.push(path);
  };

  return (
    <motion.div
      initial={prefersReducedMotion ? undefined : "initial"}
      variants={prefersReducedMotion ? undefined : buttonVariants}
      whileHover={prefersReducedMotion ? undefined : "hover"}
      whileTap={prefersReducedMotion ? undefined : "tap"}
    >
      <Button
        className={`${className || ""} ${fullWidth ? "w-full" : ""} ${
          mobileFullWidth ? "w-full sm:w-auto" : ""
        }`}
        color={color}
        size={size}
        variant={variant}
        isDisabled={isDisabled}
        startContent={startContent}
        endContent={endContent}
        onPress={handleClick}
        data-testid="cta-button"
        aria-label={`${text} - ${action}`}
      >
        {text}
      </Button>
    </motion.div>
  );
}
