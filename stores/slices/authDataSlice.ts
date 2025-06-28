// Auth data slice

import { StateCreator } from "zustand";
import { User } from "@supabase/supabase-js";

export interface AuthDataSlice {
  user: User | null;
  setUser: (user: User | null) => void;
  isInitialized: boolean;
  setIsInitialized: (isInitialized: boolean) => void;
}

export const createAuthDataSlice: StateCreator<
  AuthDataSlice,
  [],
  [],
  AuthDataSlice
> = (set) => ({
  user: null,
  setUser: (user) => set({ user }),
  isInitialized: false,
  setIsInitialized: (isInitialized) => set({ isInitialized }),
});
