"use client";

import { useEffect } from "react";
import { useShallow } from "zustand/shallow";

import { useAuthStore } from "@/stores/useAuthStore";

export function useAuth() {
  const { user, profile, isLoading, isInitialized, initialize } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
      profile: state.profile,
      isLoading: state.isLoading,
      isInitialized: state.isInitialized,
      initialize: state.initialize,
    })),
  );

  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    user,
    profile,
    loading: !isInitialized || isLoading,
    isLoading,
  };
}
