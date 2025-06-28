"use client";

import { Button } from "@heroui/button";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import log from "@/utils/logger";
import { buttonVariants } from "@/utils/animations";

interface CTAButtonProps {
  text: string;
  path: string;
  action: string;
  className?: string;
}

export function CTAButton({ text, path, action, className }: CTAButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    log.info("CTA Button clicked", {
      module: "CTAButton",
      action,
      targetPath: path,
    });
    router.push(path);
  };

  return (
    <motion.div
      initial="initial"
      variants={buttonVariants}
      whileHover="hover"
      whileTap="tap"
    >
      <Button
        className={className}
        size="lg"
        variant="solid"
        onPress={handleClick}
      >
        {text}
      </Button>
    </motion.div>
  );
}
