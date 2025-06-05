"use client";

import { useEffect } from "react";

import { useAuthStore } from "@/stores/useAuthStore";
import { createClient } from "@/utils/supabase/client";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    const supabase = createClient();

    // Listen to auth changes
    const handleAuthChange = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
    };

    // Check auth state on mount
    handleAuthChange();

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser]);

  return <>{children}</>;
}
