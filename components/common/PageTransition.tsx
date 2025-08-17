"use client";

import { motion, useReducedMotion } from "framer-motion";

import { pageTransition } from "@/utils/animations";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? (
    <div className={className}>{children}</div>
  ) : (
    <motion.div
      animate={"animate"}
      className={className}
      exit={"exit"}
      initial={"initial"}
      variants={pageTransition}
    >
      {children}
    </motion.div>
  );
}
