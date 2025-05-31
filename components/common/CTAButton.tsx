"use client";

import { Button } from "@heroui/button";
import { useRouter } from "next/navigation";

import log from "@/utils/logger";

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
    <Button
      className={className}
      size="lg"
      variant="solid"
      onPress={handleClick}
    >
      {text}
    </Button>
  );
}
