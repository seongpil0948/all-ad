"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/use-auth";

interface LoginRedirectProps {
  returnUrl?: string;
}

export function LoginRedirect({ returnUrl }: LoginRedirectProps) {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Give a small delay to ensure auth state is propagated
      const timer = setTimeout(() => {
        router.push(
          returnUrl && returnUrl.startsWith("/") ? returnUrl : "/dashboard",
        );
        router.refresh();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [user, returnUrl, router]);

  return null;
}
