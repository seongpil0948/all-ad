"use client";

import { motion } from "framer-motion";
import { Table, TableBody } from "@heroui/table";

import { staggerContainer, staggerItem } from "@/utils/animations";

interface AnimatedTableProps {
  children: React.ReactNode;
  ariaLabel: string;
}

export function AnimatedTable({ children, ariaLabel }: AnimatedTableProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <Table aria-label={ariaLabel}>{children as any}</Table>;
}

interface AnimatedTableBodyProps {
  children: React.ReactNode;
}

export function AnimatedTableBody({ children }: AnimatedTableBodyProps) {
  return (
    <TableBody>
      <motion.div
        animate="animate"
        initial="initial"
        variants={staggerContainer}
      >
        {children}
      </motion.div>
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
  return (
    <motion.tr
      key={key}
      className={className}
      variants={staggerItem}
      whileHover={{
        backgroundColor: "rgba(0, 0, 0, 0.02)",
        scale: 1.01,
        transition: { duration: 0.2 },
      }}
    >
      {children}
    </motion.tr>
  );
}
