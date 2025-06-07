// Platform actions slice

import { StateCreator } from "zustand";

import { LoadingSlice } from "./loadingSlice";
import { ErrorSlice } from "./errorSlice";
import { PlatformDataSlice } from "./platformDataSlice";

import { PlatformCredential, PlatformType } from "@/types/database.types";
import { Json } from "@/types/supabase.types";
import { createClient } from "@/utils/supabase/client";
import log from "@/utils/logger";

export interface PlatformActionsSlice {
  fetchCredentials: () => Promise<void>;
  addCredential: (
    platform: PlatformType,
    credentials: Record<string, unknown>,
  ) => Promise<void>;
  updateCredential: (
    id: string,
    credentials: Record<string, unknown>,
  ) => Promise<void>;
  toggleCredentialStatus: (id: string) => Promise<void>;
  deleteCredential: (id: string) => Promise<void>;
  syncAllPlatforms: () => Promise<void>;
  syncPlatform: (platform: PlatformType) => Promise<void>;
}

type PlatformStoreSlices = LoadingSlice &
  ErrorSlice &
  PlatformDataSlice &
  PlatformActionsSlice;

export const createPlatformActionsSlice: StateCreator<
  PlatformStoreSlices,
  [],
  [],
  PlatformActionsSlice
> = (set, get) => ({
  fetchCredentials: async () => {
    const supabase = createClient();

    set({ isLoading: true, error: null });

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("No user logged in");

      // Get user's team
      const { data: teamMember } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id)
        .single();

      if (!teamMember?.team_id) throw new Error("No team found");

      const { data, error } = await supabase
        .from("platform_credentials")
        .select("*")
        .eq("team_id", teamMember.team_id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      set({
        credentials: (data || []) as PlatformCredential[],
        isLoading: false,
      });
    } catch (error) {
      log.error("Failed to fetch credentials", error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addCredential: async (platform, credentials) => {
    const supabase = createClient();

    set({ isLoading: true, error: null });

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("No user logged in");

      const { data: teamMember } = await supabase
        .from("team_members")
        .select("team_id, role")
        .eq("user_id", user.id)
        .single();

      if (!teamMember) throw new Error("No team found");
      if (teamMember.role === "viewer") {
        throw new Error("Viewers cannot add credentials");
      }

      const { error } = await supabase.from("platform_credentials").insert({
        team_id: teamMember.team_id,
        platform,
        credentials: credentials as Json,
        created_by: user.id,
      });

      if (error) throw error;

      await get().fetchCredentials();
      set({ isLoading: false });
    } catch (error) {
      log.error("Failed to add credential", error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateCredential: async (id, credentials) => {
    const supabase = createClient();

    set({ isLoading: true, error: null });

    try {
      const { error } = await supabase
        .from("platform_credentials")
        .update({
          credentials: credentials as Json,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      await get().fetchCredentials();
      set({ isLoading: false });
    } catch (error) {
      log.error("Failed to update credential", error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  toggleCredentialStatus: async (id) => {
    const supabase = createClient();
    const credential = get().credentials.find((c) => c.id === id);

    if (!credential) {
      set({ error: "Credential not found" });

      return;
    }

    set({ isLoading: true, error: null });

    try {
      const { error } = await supabase
        .from("platform_credentials")
        .update({
          is_active: !credential.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      await get().fetchCredentials();
      set({ isLoading: false });
    } catch (error) {
      log.error("Failed to toggle credential status", error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deleteCredential: async (id) => {
    const supabase = createClient();

    set({ isLoading: true, error: null });

    try {
      const { error } = await supabase
        .from("platform_credentials")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await get().fetchCredentials();
      set({ isLoading: false });
    } catch (error) {
      log.error("Failed to delete credential", error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  syncAllPlatforms: async () => {
    const credentials = get().credentials.filter((c) => c.is_active);

    for (const credential of credentials) {
      await get().syncPlatform(credential.platform);
    }
  },

  syncPlatform: async (platform) => {
    set((state) => ({
      syncProgress: { ...state.syncProgress, [platform]: 0 },
    }));

    try {
      const response = await fetch(`/api/sync/${platform}`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`Failed to sync ${platform}`);
      }

      set((state) => ({
        syncProgress: { ...state.syncProgress, [platform]: 100 },
      }));

      // Reset progress after 2 seconds
      setTimeout(() => {
        set((state) => ({
          syncProgress: { ...state.syncProgress, [platform]: 0 },
        }));
      }, 2000);
    } catch (error) {
      log.error(`Failed to sync ${platform}`, error);
      set({ error: (error as Error).message });
      set((state) => ({
        syncProgress: { ...state.syncProgress, [platform]: 0 },
      }));
    }
  },
});
