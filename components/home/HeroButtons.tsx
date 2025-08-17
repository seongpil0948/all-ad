"use client";

import { Button } from "@heroui/button";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

import log from "@/utils/logger";
import { staggerContainer, staggerItem } from "@/utils/animations";
import { useDictionary } from "@/hooks/use-dictionary";

interface HeroButtonsProps {
  primaryButtonText: string;
  secondaryButtonText: string;
}

export function HeroButtons({
  primaryButtonText,
  secondaryButtonText,
}: HeroButtonsProps) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const { dictionary: dict } = useDictionary();

  const handleNavigation = (path: string, action: string) => {
    log.info("Navigation initiated", {
      module: "HeroButtons",
      action,
      targetPath: path,
      fromPath: "/",
    });
    router.push(path);
  };

  return (
    <motion.div
      animate={prefersReducedMotion ? undefined : "animate"}
      className="flex gap-4 justify-center"
      initial={prefersReducedMotion ? undefined : "initial"}
      variants={prefersReducedMotion ? undefined : staggerContainer}
      data-testid="hero-buttons"
      role="group"
      aria-label={dict.common.actions}
    >
      <motion.div
        transition={
          prefersReducedMotion
            ? undefined
            : { type: "spring", stiffness: 400, damping: 17 }
        }
        variants={prefersReducedMotion ? undefined : staggerItem}
        whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
      >
        <Button
          color="primary"
          size="lg"
          variant="shadow"
          onPress={() => handleNavigation("/login", "start-free")}
          data-testid="hero-primary-button"
          aria-label={primaryButtonText}
        >
          {primaryButtonText}
        </Button>
      </motion.div>
      <motion.div
        transition={
          prefersReducedMotion
            ? undefined
            : { type: "spring", stiffness: 400, damping: 17 }
        }
        variants={prefersReducedMotion ? undefined : staggerItem}
        whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
      >
        <Button
          size="lg"
          variant="bordered"
          onPress={() => handleNavigation("/demo", "view-demo")}
          data-testid="hero-secondary-button"
          aria-label={secondaryButtonText}
        >
          {secondaryButtonText}
        </Button>
      </motion.div>
    </motion.div>
  );
}
