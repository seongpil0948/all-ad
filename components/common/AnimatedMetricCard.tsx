"use client";

import { Card, CardBody } from "@heroui/card";
import { cn } from "@heroui/theme";
import {
  motion,
  useMotionValue,
  animate,
  useInView,
  useReducedMotion,
} from "framer-motion";
import { useEffect, useRef } from "react";

import { fadeInUp, cardHover } from "@/utils/animations";

interface AnimatedMetricCardProps {
  label: string;
  value: string | number;
  change?: string;
  isNegative?: boolean;
  suffix?: string;
  prefix?: string;
  animateNumber?: boolean;
  "data-testid"?: string;
  shadow?: "none" | "sm" | "md" | "lg";
  radius?: "none" | "sm" | "md" | "lg";
  icon?: React.ReactNode;
}

export function AnimatedMetricCard({
  label,
  value,
  change,
  isNegative,
  suffix = "",
  prefix = "",
  animateNumber = true,

  shadow = "sm",
  radius = "md",
  icon,
}: AnimatedMetricCardProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const prefersReducedMotion = useReducedMotion();
  const count = useMotionValue(0);

  useEffect(() => {
    if (
      isInView &&
      animateNumber &&
      !prefersReducedMotion &&
      typeof value === "number"
    ) {
      const controls = animate(count, value, {
        duration: 1.5,
        ease: "easeOut",
      });

      return controls.stop;
    }
  }, [value, isInView, animateNumber, count, prefersReducedMotion]);

  const renderValue = () => {
    if (animateNumber && !prefersReducedMotion && typeof value === "number") {
      return (
        <>
          {prefix}
          <motion.span>
            {count.get().toLocaleString("ko-KR", { maximumFractionDigits: 0 })}
          </motion.span>
          {suffix}
        </>
      );
    }

    return `${prefix}${value}${suffix}`;
  };

  return (
    <motion.div
      ref={ref}
      animate={
        prefersReducedMotion ? undefined : isInView ? "animate" : "initial"
      }
      initial={prefersReducedMotion ? undefined : "initial"}
      variants={
        prefersReducedMotion ? undefined : { ...fadeInUp, ...cardHover }
      }
      whileHover={prefersReducedMotion ? undefined : "hover"}
      data-testid="animated-metric-card"
    >
      <Card
        className="h-full"
        shadow={shadow}
        radius={radius}
        role="region"
        aria-labelledby={`metric-${label.replace(/\s+/g, "-").toLowerCase()}`}
      >
        <CardBody>
          <div className="flex items-center justify-between mb-2">
            <motion.p
              animate={prefersReducedMotion ? undefined : { opacity: 1 }}
              className="text-default-500 text-sm"
              initial={prefersReducedMotion ? undefined : { opacity: 0 }}
              transition={prefersReducedMotion ? undefined : { delay: 0.2 }}
              id={`metric-${label.replace(/\s+/g, "-").toLowerCase()}`}
            >
              {label}
            </motion.p>
            {icon && (
              <motion.div
                animate={
                  prefersReducedMotion ? undefined : { opacity: 1, scale: 1 }
                }
                initial={
                  prefersReducedMotion ? undefined : { opacity: 0, scale: 0.8 }
                }
                transition={prefersReducedMotion ? undefined : { delay: 0.2 }}
                className="text-default-400"
                role="presentation"
                aria-hidden={true}
              >
                {icon}
              </motion.div>
            )}
          </div>
          <motion.div
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            className="text-2xl font-bold"
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 10 }}
            transition={prefersReducedMotion ? undefined : { delay: 0.3 }}
            aria-label={`${label} value: ${prefix}${value}${suffix}`}
            data-testid={`metric-value-${label.replace(/\s+/g, "-").toLowerCase()}`}
          >
            {renderValue()}
          </motion.div>
          {change && (
            <motion.p
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              className={cn(
                "text-sm",
                isNegative ? "text-danger" : "text-success",
              )}
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 5 }}
              transition={prefersReducedMotion ? undefined : { delay: 0.4 }}
              aria-label={`Change: ${change} ${isNegative ? "decrease" : "increase"}`}
              data-testid={`metric-change-${label.replace(/\s+/g, "-").toLowerCase()}`}
            >
              <motion.span
                animate={prefersReducedMotion ? undefined : { scale: 1 }}
                initial={prefersReducedMotion ? undefined : { scale: 0 }}
                transition={
                  prefersReducedMotion
                    ? undefined
                    : {
                        delay: 0.5,
                        type: "spring",
                        stiffness: 400,
                        damping: 17,
                      }
                }
                aria-hidden={true}
              >
                {isNegative ? "▼" : "▲"}
              </motion.span>{" "}
              {change}
            </motion.p>
          )}
        </CardBody>
      </Card>
    </motion.div>
  );
}
