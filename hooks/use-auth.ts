"use client";

import { useShallow } from "zustand/shallow";

import { useAuthStore } from "@/stores/useAuthStore";

export function useAuth() {
  const { user, isLoading } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
      isLoading: state.isLoading,
    })),
  );

  return {
    user,
    profile: null, // Profile is not stored in the new auth store
    loading: isLoading,
    isLoading,
  };
}
