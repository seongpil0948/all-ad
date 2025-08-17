"use client";

import type { LoadingStateProps } from "@/types/components";

import { Spinner } from "@heroui/spinner";
import { motion, useReducedMotion } from "framer-motion";

import { fadeIn, scaleIn } from "@/utils/animations";
import { useDictionary } from "@/hooks/use-dictionary";

export function LoadingState({
  message,
  size = "lg",
  fullScreen = false,
}: LoadingStateProps) {
  const { dictionary: dict } = useDictionary();
  const defaultMessage = message || dict.common.loading;
  const containerClass = fullScreen
    ? "fixed inset-0 flex justify-center items-center bg-background/80 backdrop-blur-sm z-50"
    : "flex justify-center items-center h-64";
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      animate={prefersReducedMotion ? undefined : "animate"}
      aria-label={defaultMessage}
      className={containerClass}
      data-testid="loading-state"
      exit={prefersReducedMotion ? undefined : "exit"}
      initial={prefersReducedMotion ? undefined : "initial"}
      role="status"
      variants={prefersReducedMotion ? undefined : fadeIn}
    >
      <motion.div
        animate={prefersReducedMotion ? undefined : "animate"}
        className="flex flex-col items-center gap-4"
        initial={prefersReducedMotion ? undefined : "initial"}
        variants={prefersReducedMotion ? undefined : scaleIn}
      >
        <Spinner size={size} data-testid="loading-spinner" />
        {defaultMessage && (
          <motion.p
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            aria-live={"polite"}
            className="text-default-500 text-sm"
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 10 }}
            transition={prefersReducedMotion ? undefined : { delay: 0.2 }}
          >
            {defaultMessage}
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
}
