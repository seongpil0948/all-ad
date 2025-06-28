"use client";

import { Card, CardBody } from "@heroui/card";
import { cn } from "@heroui/theme";
import { motion, useMotionValue, animate, useInView } from "framer-motion";
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
}

export function AnimatedMetricCard({
  label,
  value,
  change,
  isNegative,
  suffix = "",
  prefix = "",
  animateNumber = true,
}: AnimatedMetricCardProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const count = useMotionValue(0);

  useEffect(() => {
    if (isInView && animateNumber && typeof value === "number") {
      const controls = animate(count, value, {
        duration: 1.5,
        ease: "easeOut",
      });

      return controls.stop;
    }
  }, [value, isInView, animateNumber, count]);

  const renderValue = () => {
    if (animateNumber && typeof value === "number") {
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
      animate={isInView ? "animate" : "initial"}
      initial="initial"
      variants={{
        ...fadeInUp,
        ...cardHover,
      }}
      whileHover="hover"
    >
      <Card className="h-full">
        <CardBody>
          <motion.p
            animate={{ opacity: 1 }}
            className="text-default-500 text-sm"
            initial={{ opacity: 0 }}
            transition={{ delay: 0.2 }}
          >
            {label}
          </motion.p>
          <motion.p
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold"
            initial={{ opacity: 0, y: 10 }}
            transition={{ delay: 0.3 }}
          >
            {renderValue()}
          </motion.p>
          {change && (
            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "text-sm",
                isNegative ? "text-danger" : "text-success",
              )}
              initial={{ opacity: 0, y: 5 }}
              transition={{ delay: 0.4 }}
            >
              <motion.span
                animate={{ scale: 1 }}
                initial={{ scale: 0 }}
                transition={{
                  delay: 0.5,
                  type: "spring",
                  stiffness: 400,
                  damping: 17,
                }}
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
