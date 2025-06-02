import { create } from "zustand";

import { createClient } from "@/utils/supabase/client";
import { Profile } from "@/types/database.types";
import { Logger } from "@/utils/logger";

interface AuthState {
  user: Profile | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchUser: () => Promise<void>;
  checkUser: () => Promise<boolean>;
  updateUser: (updates: Partial<Profile>) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isLoading: false,
  error: null,

  checkUser: async () => {
    const supabase = createClient();

    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        // Optionally fetch profile if not already loaded
        const currentUser = useAuthStore.getState().user;

        if (!currentUser) {
          await useAuthStore.getState().fetchUser();
        }

        return true;
      }

      return false;
    } catch (error) {
      Logger.error(`Error checking user: ${error}`);

      return false;
    }
  },

  fetchUser: async () => {
    const supabase = createClient();

    set({ isLoading: true, error: null });

    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();

        if (error) throw error;
        set({ user: profile, isLoading: false });
      } else {
        set({ user: null, isLoading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateUser: async (updates) => {
    const supabase = createClient();
    const user = useAuthStore.getState().user;

    if (!user) {
      set({ error: "No user logged in" });

      return;
    }

    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;
      set({ user: data, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  logout: async () => {
    const supabase = createClient();

    set({ isLoading: true, error: null });

    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;
      set({ user: null, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
