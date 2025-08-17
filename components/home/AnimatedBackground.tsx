"use client";

import { motion, useReducedMotion } from "framer-motion";

export const AnimatedBackground = () => {
  const prefersReducedMotion = useReducedMotion();
  return (
    <div
      className="absolute inset-0 -z-10 overflow-hidden"
      data-testid="animated-background"
    >
      {/* Gradient background */}
      <div className="absolute inset-0 bg-linear-to-br from-violet-100 to-pink-100 dark:from-violet-900/20 dark:to-pink-900/20 opacity-50" />

      {/* Animated circles */}
      <motion.div
        animate={
          prefersReducedMotion
            ? undefined
            : {
                x: [0, 100, 0],
                y: [0, -50, 0],
              }
        }
        className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl"
        transition={
          prefersReducedMotion
            ? undefined
            : { duration: 20, repeat: Infinity, ease: "easeInOut" }
        }
        aria-hidden={true}
      />
      <motion.div
        animate={
          prefersReducedMotion
            ? undefined
            : {
                x: [0, -100, 0],
                y: [0, 50, 0],
              }
        }
        className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"
        transition={
          prefersReducedMotion
            ? undefined
            : { duration: 25, repeat: Infinity, ease: "easeInOut" }
        }
        aria-hidden={true}
      />
      <motion.div
        animate={
          prefersReducedMotion
            ? undefined
            : { scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }
        }
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-warning/10 rounded-full blur-3xl"
        transition={
          prefersReducedMotion
            ? undefined
            : { duration: 15, repeat: Infinity, ease: "easeInOut" }
        }
        aria-hidden={true}
      />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />
    </div>
  );
};
