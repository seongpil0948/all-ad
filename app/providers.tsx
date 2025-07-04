"use client";

import * as React from "react";
import { HeroUIProvider } from "@heroui/system";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ToastProvider } from "@heroui/toast";

import { AuthProvider } from "@/components/features/auth/AuthProvider";
import { ProvidersProps } from "@/types/components";

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NonNullable<
      Parameters<ReturnType<typeof useRouter>["push"]>[1]
    >;
  }
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();

  return (
    <HeroUIProvider navigate={router.push}>
      <NextThemesProvider {...themeProps}>
        <AuthProvider>{children}</AuthProvider>
        <ToastProvider
          maxVisibleToasts={3}
          placement="bottom-right"
          toastProps={{
            radius: "md",
            shouldShowTimeoutProgress: true,
          }}
        />
      </NextThemesProvider>
    </HeroUIProvider>
  );
}
