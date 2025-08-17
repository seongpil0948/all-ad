"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Table, TableBody } from "@heroui/table";
import type { ComponentProps } from "react";

import { staggerContainer, staggerItem } from "@/utils/animations";

type HeroUITableProps = ComponentProps<typeof Table>;

interface AnimatedTableProps {
  children: HeroUITableProps["children"];
  ariaLabel: string;
}

export function AnimatedTable({ children, ariaLabel }: AnimatedTableProps) {
  return <Table aria-label={ariaLabel}>{children}</Table>;
}

interface AnimatedTableBodyProps {
  children: React.ReactNode;
}

export function AnimatedTableBody({ children }: AnimatedTableBodyProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <TableBody>
      {prefersReducedMotion ? (
        <div>{children}</div>
      ) : (
        <motion.div
          animate={"animate"}
          initial={"initial"}
          variants={staggerContainer}
        >
          {children}
        </motion.div>
      )}
    </TableBody>
  );
}

interface AnimatedTableRowProps {
  children: React.ReactNode;
  className?: string;
  key: string | number;
}

export function AnimatedTableRow({
  children,
  className,
  key,
}: AnimatedTableRowProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.tr
      key={key}
      className={className}
      variants={staggerItem}
      whileHover={
        prefersReducedMotion
          ? { backgroundColor: "rgba(0, 0, 0, 0.02)" }
          : {
              backgroundColor: "rgba(0, 0, 0, 0.02)",
              scale: 1.01,
              transition: { duration: 0.2 },
            }
      }
    >
      {children}
    </motion.tr>
  );
}
