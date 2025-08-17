"use client";

import React from "react";
import { useDictionary } from "@/hooks/use-dictionary";

export function SkipLink() {
  const { dictionary: dict } = useDictionary();
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-3 focus:py-2 focus:rounded-md focus:bg-background focus:text-foreground focus:shadow-md"
      data-testid="skip-to-content"
      aria-label={dict.common.skipToContent}
    >
      {dict.common.skipToContent}
    </a>
  );
}
