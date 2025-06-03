import { create } from "zustand";

import { useCampaignStore } from "./useCampaignStore";

import { createClient } from "@/utils/supabase/client";
import { PlatformCredential, PlatformType } from "@/types/database.types";

interface PlatformState {
  credentials: PlatformCredential[];
  isLoading: boolean;
  error: string | null;
  syncProgress: Record<PlatformType, number>;

  // Actions
  setCredentials: (credentials: PlatformCredential[]) => void;
  fetchCredentials: () => Promise<void>;
  addCredential: (
    platform: PlatformType,
    credentials: Record<string, any>,
  ) => Promise<void>;
  updateCredential: (
    id: string,
    credentials: Record<string, any>,
  ) => Promise<void>;
  toggleCredentialStatus: (id: string) => Promise<void>;
  deleteCredential: (id: string) => Promise<void>;
  syncAllPlatforms: () => Promise<void>;
  syncPlatform: (platform: PlatformType) => Promise<void>;
  clearError: () => void;
}

export const usePlatformStore = create<PlatformState>()((set, get) => ({
  credentials: [],
  isLoading: false,
  error: null,
  syncProgress: {
    facebook: 0,
    google: 0,
    kakao: 0,
    naver: 0,
    coupang: 0,
  },

  setCredentials: (credentials) => {
    set({ credentials });
  },

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

      if (!teamMember || !teamMember.team_id) throw new Error("No team found");

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
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addCredential: async (
    platform: PlatformType,
    credentials: Record<string, any>,
  ) => {
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
        credentials,
        created_by: user.id,
      });

      if (error) throw error;

      await get().fetchCredentials();
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateCredential: async (id: string, credentials: Record<string, any>) => {
    const supabase = createClient();

    set({ isLoading: true, error: null });

    try {
      const { error } = await supabase
        .from("platform_credentials")
        .update({ credentials, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      await get().fetchCredentials();
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  toggleCredentialStatus: async (id: string) => {
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
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deleteCredential: async (id: string) => {
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
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  syncAllPlatforms: async () => {
    const credentials = get().credentials.filter((c) => c.is_active);

    for (const credential of credentials) {
      await get().syncPlatform(credential.platform);
    }

    // Refresh campaigns after sync
    const campaignStore = useCampaignStore.getState();

    await campaignStore.fetchCampaigns();
  },

  syncPlatform: async (platform: PlatformType) => {
    set((state) => ({
      syncProgress: { ...state.syncProgress, [platform]: 0 },
    }));

    try {
      // Call sync API endpoint
      const response = await fetch(`/api/sync/${platform}`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`Failed to sync ${platform}`);
      }

      // Update progress to 100%
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
      set({ error: (error as Error).message });
      // Reset progress on error
      set((state) => ({
        syncProgress: { ...state.syncProgress, [platform]: 0 },
      }));
    }
  },

  clearError: () => set({ error: null }),
}));
