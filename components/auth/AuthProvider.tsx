"use client";

import { useEffect } from "react";

import { useAuthStore } from "@/stores/useAuthStore";
import { createClient } from "@/utils/supabase/client";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((state) => state.initialize);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const setUser = useAuthStore((state) => state.setUser);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);

  useEffect(() => {
    const supabase = createClient();

    // Initialize auth store
    if (!isInitialized) {
      initialize();
    }

    // Listen to auth changes from the browser (for immediate updates)
    const handleStorageChange = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUser(user);
        await fetchProfile(user.id);
      } else {
        setUser(null);
      }
    };

    // Check auth state on mount and when localStorage changes
    handleStorageChange();
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [initialize, isInitialized, setUser, fetchProfile]);

  return <>{children}</>;
}
