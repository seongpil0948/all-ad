"use client";

import type { LoadingStateProps } from "@/types/components";

import { Spinner } from "@heroui/spinner";
import { motion } from "framer-motion";

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

  return (
    <motion.div
      animate="animate"
      aria-label="Loading"
      className={containerClass}
      exit="exit"
      initial="initial"
      role="status"
      variants={fadeIn}
    >
      <motion.div
        animate="animate"
        className="flex flex-col items-center gap-4"
        initial="initial"
        variants={scaleIn}
      >
        <Spinner size={size} />
        {defaultMessage && (
          <motion.p
            animate={{ opacity: 1, y: 0 }}
            aria-live="polite"
            className="text-default-500 text-sm"
            initial={{ opacity: 0, y: 10 }}
            transition={{ delay: 0.2 }}
          >
            {defaultMessage}
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
}
