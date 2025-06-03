import { create } from "zustand";
import { User } from "@supabase/supabase-js";

import { createClient } from "@/utils/supabase/client";
import { Profile } from "@/types/database.types";
import log from "@/utils/logger";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  fetchProfile: (userId: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

// Singleton supabase client
let supabaseClient: ReturnType<typeof createClient> | null = null;

const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClient();
  }

  return supabaseClient;
};

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  profile: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  initialize: async () => {
    const { isInitialized } = get();

    if (isInitialized) return;

    set({ isLoading: true, error: null });
    const supabase = getSupabaseClient();

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        set({ user });
        // Fetch profile
        await get().fetchProfile(user.id);
      }

      // Set up auth state change listener
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        log.info(`Auth state changed: ${event}`);

        if (event === "SIGNED_IN" && session?.user) {
          set({ user: session.user });
          await get().fetchProfile(session.user.id);
        } else if (event === "SIGNED_OUT") {
          get().reset();
        } else if (event === "USER_UPDATED" && session?.user) {
          set({ user: session.user });
        } else if (event === "INITIAL_SESSION" && session?.user) {
          set({ user: session.user });
          await get().fetchProfile(session.user.id);
        }
      });

      // Store subscription for cleanup if needed
      (window as any).__authSubscription = subscription;

      set({ isInitialized: true, isLoading: false });
    } catch (error) {
      log.error("Error initializing auth:", error);
      set({
        error: (error as Error).message,
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  setUser: (user) => set({ user }),

  setProfile: (profile) => set({ profile }),

  fetchProfile: async (userId: string) => {
    const supabase = getSupabaseClient();

    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // Profile doesn't exist, might be a new user
          log.warn("Profile not found for user:" + userId);
        } else {
          throw error;
        }
      }

      set({ profile });
    } catch (error) {
      log.error("Error fetching profile:", error);
      set({ error: (error as Error).message });
    }
  },

  updateProfile: async (updates) => {
    const { user } = get();

    if (!user) {
      set({ error: "No user logged in" });

      return;
    }

    set({ isLoading: true, error: null });
    const supabase = getSupabaseClient();

    try {
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;
      set({ profile: data, isLoading: false });
    } catch (error) {
      log.error("Error updating profile:", error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    const supabase = getSupabaseClient();

    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      // Reset will be called by onAuthStateChange listener
    } catch (error) {
      log.error("Error logging out:", error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      user: null,
      profile: null,
      isLoading: false,
      error: null,
      // Keep isInitialized as true
    }),
}));
