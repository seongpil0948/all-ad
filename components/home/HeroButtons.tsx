"use client";

import { Button } from "@heroui/button";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import log from "@/utils/logger";
import { staggerContainer, staggerItem } from "@/utils/animations";

interface HeroButtonsProps {
  primaryButtonText: string;
  secondaryButtonText: string;
}

export function HeroButtons({
  primaryButtonText,
  secondaryButtonText,
}: HeroButtonsProps) {
  const router = useRouter();

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
      animate="animate"
      className="flex gap-4 justify-center"
      initial="initial"
      variants={staggerContainer}
    >
      <motion.div
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        variants={staggerItem}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          color="primary"
          size="lg"
          variant="shadow"
          onPress={() => handleNavigation("/login", "start-free")}
        >
          {primaryButtonText}
        </Button>
      </motion.div>
      <motion.div
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        variants={staggerItem}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          size="lg"
          variant="bordered"
          onPress={() => handleNavigation("/demo", "view-demo")}
        >
          {secondaryButtonText}
        </Button>
      </motion.div>
    </motion.div>
  );
}
