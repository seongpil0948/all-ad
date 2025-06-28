"use client";

import { useEffect } from "react";
import { useShallow } from "zustand/shallow";

import { useAuthStore } from "@/stores/useAuthStore";
import { createClient } from "@/utils/supabase/client";
import log from "@/utils/logger";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setIsLoading, setIsInitialized } = useAuthStore(
    useShallow((state) => ({
      setUser: state.setUser,
      setIsLoading: state.setIsLoading,
      setIsInitialized: state.setIsInitialized,
    })),
  );

  useEffect(() => {
    const supabase = createClient();

    // Initialize auth state
    const initializeAuth = async () => {
      try {
        setIsLoading(true);

        // Small delay to ensure cookies are properly set after server action redirect
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Get current session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          log.error("Error getting session:", sessionError);
          setUser(null);

          return;
        }

        // If we have a session, get the user
        if (session) {
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();

          if (userError) {
            log.error("Error getting user:", userError);
            setUser(null);
          } else {
            log.info("User authenticated:", {
              userId: user?.id,
              email: user?.email,
            });
            setUser(user);
          }
        } else {
          log.info("No session found");
          setUser(null);
        }
      } catch (error) {
        log.error("Error initializing auth:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    // Initialize auth state
    initializeAuth();

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      log.info("Auth state changed:", { event, hasSession: !!session });

      if (event === "INITIAL_SESSION") {
        // Handle initial session on page load
        if (session?.user) {
          setUser(session.user);
        }
        setIsLoading(false);
        setIsInitialized(true);
      } else if (event === "SIGNED_IN") {
        // Just use the session from the event
        if (session?.user) {
          setUser(session.user);
          setIsInitialized(true);
        }
      } else if (event === "TOKEN_REFRESHED") {
        setUser(session?.user ?? null);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      } else if (event === "USER_UPDATED") {
        // Re-fetch user data when updated
        const {
          data: { user },
        } = await supabase.auth.getUser();

        setUser(user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setIsLoading, setIsInitialized]);

  return <>{children}</>;
}
