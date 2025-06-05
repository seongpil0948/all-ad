// Auth data slice

import { StateCreator } from "zustand";
import { User } from "@supabase/supabase-js";

export interface AuthDataSlice {
  user: User | null;
  setUser: (user: User | null) => void;
}

export const createAuthDataSlice: StateCreator<
  AuthDataSlice,
  [],
  [],
  AuthDataSlice
> = (set) => ({
  user: null,
  setUser: (user) => set({ user }),
});
