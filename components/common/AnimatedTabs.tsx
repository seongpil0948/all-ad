"use client";

import { Tabs, Tab } from "@heroui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { Key, ReactNode } from "react";

import { tabVariants } from "@/utils/animations";

interface AnimatedTabsProps {
  ariaLabel: string;
  children: ReactNode;
  selectedKey?: string;
  onSelectionChange?: (key: Key) => void;
  variant?: "solid" | "light" | "underlined" | "bordered";
  color?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  disableAnimation?: boolean;
  className?: string;
}

export function AnimatedTabs({
  ariaLabel,
  children,
  selectedKey,
  onSelectionChange,
  variant = "solid",
  color = "primary",
  size = "md",
  fullWidth = false,
  disableAnimation = false,
  className,
}: AnimatedTabsProps) {
  return (
    <Tabs
      aria-label={ariaLabel}
      className={className}
      color={color}
      disableAnimation={disableAnimation}
      fullWidth={fullWidth}
      motionProps={{
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.3 },
      }}
      selectedKey={selectedKey}
      size={size}
      variant={variant}
      onSelectionChange={onSelectionChange}
    >
      {children}
    </Tabs>
  );
}

interface AnimatedTabProps {
  key: string;
  title: ReactNode;
  children: ReactNode;
}

export function AnimatedTab({ key, title, children }: AnimatedTabProps) {
  return (
    <Tab key={key} title={title}>
      <AnimatePresence mode="wait">
        <motion.div
          key={key}
          animate="animate"
          exit="exit"
          initial="initial"
          variants={tabVariants}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </Tab>
  );
}
