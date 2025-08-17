"use client";

import React from "react";
import { Card, CardBody } from "@heroui/card";
import { FaInbox } from "react-icons/fa";
import { motion, useReducedMotion } from "framer-motion";

import { fadeInUp, staggerContainer, staggerItem } from "@/utils/animations";
import { useDictionary } from "@/hooks/use-dictionary";

interface EmptyStateProps {
  message?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({
  message,
  description,
  icon = <FaInbox size={48} />,
  action,
}: EmptyStateProps) {
  const { dictionary: dict } = useDictionary();
  const defaultMessage = message || dict.common.noData;
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      animate={"animate"}
      className="w-full"
      initial={"initial"}
      variants={fadeInUp}
      data-testid="empty-state"
      role="region"
      aria-label={defaultMessage}
    >
      <Card className="w-full">
        <CardBody className="flex flex-col items-center justify-center py-12">
          <motion.div
            animate={"animate"}
            className="flex flex-col items-center"
            initial={"initial"}
            variants={staggerContainer}
          >
            <motion.div
              animate={
                prefersReducedMotion
                  ? undefined
                  : {
                      y: [0, -10, 0],
                      transition: {
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut",
                      },
                    }
              }
              className="text-default-300 mb-4"
              variants={staggerItem}
              role="presentation"
              aria-hidden={true}
            >
              {icon}
            </motion.div>
            <motion.h3
              className="text-lg font-semibold text-default-700 mb-2"
              variants={staggerItem}
            >
              {defaultMessage}
            </motion.h3>
            {description && (
              <motion.p
                className="text-sm text-default-500 text-center max-w-md mb-4"
                variants={staggerItem}
              >
                {description}
              </motion.p>
            )}
            {action && (
              <motion.div className="mt-4" variants={staggerItem}>
                {action}
              </motion.div>
            )}
          </motion.div>
        </CardBody>
      </Card>
    </motion.div>
  );
}
