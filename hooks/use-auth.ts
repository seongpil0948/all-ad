"use client";

import { useAuthStore } from "@/stores/useAuthStore";

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);

  return {
    user,
    profile: null, // Profile is not stored in the new auth store
    loading: isLoading,
    isLoading,
  };
}
