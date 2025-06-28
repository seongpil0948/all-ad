"use client";

import { motion } from "framer-motion";

import { pageTransition } from "@/utils/animations";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      animate="animate"
      className={className}
      exit="exit"
      initial="initial"
      variants={pageTransition}
    >
      {children}
    </motion.div>
  );
}
