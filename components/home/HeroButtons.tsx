"use client";

import { Button } from "@heroui/button";
import { useRouter } from "next/navigation";

import log from "@/utils/logger";

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
    <div className="flex gap-4 justify-center">
      <Button
        color="primary"
        size="lg"
        variant="shadow"
        onPress={() => handleNavigation("/login", "start-free")}
      >
        {primaryButtonText}
      </Button>
      <Button
        size="lg"
        variant="bordered"
        onPress={() => handleNavigation("/demo", "view-demo")}
      >
        {secondaryButtonText}
      </Button>
    </div>
  );
}
