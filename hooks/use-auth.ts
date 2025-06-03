"use client";

import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";

import { createClient } from "@/utils/supabase/client";
import log from "@/utils/logger";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Get initial user
    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        setUser(user);
      } catch (error) {
        log.error("Error getting user", error as Error, {
          module: "useAuth",
          hook: "useAuth",
        });
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      log.info("Auth state changed", {
        event: _event,
        session,
        module: "useAuth",
        hook: "useAuth",
      });
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return { user, loading };
}
