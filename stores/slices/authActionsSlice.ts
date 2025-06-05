// Auth actions slice

import { StateCreator } from "zustand";

import { AuthDataSlice } from "./authDataSlice";
import { LoadingSlice } from "./loadingSlice";

import { createClient } from "@/utils/supabase/client";

export interface AuthActionsSlice {
  signOut: () => Promise<void>;
}

export const createAuthActionsSlice: StateCreator<
  AuthDataSlice & LoadingSlice & AuthActionsSlice,
  [],
  [],
  AuthActionsSlice
> = (set) => ({
  signOut: async () => {
    set({ isLoading: true });

    try {
      const supabase = createClient();

      await supabase.auth.signOut();
      set({ user: null, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
});
