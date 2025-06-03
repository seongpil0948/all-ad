// Platform state management using Zustand

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

import { Platform, PlatformStatus, PlatformType } from "@/types";
import logger from "@/utils/logger";

interface PlatformState {
  platforms: Platform[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setPlatforms: (platforms: Platform[]) => void;
  addPlatform: (platform: Platform) => void;
  updatePlatform: (id: string, updates: Partial<Platform>) => void;
  removePlatform: (id: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Async actions
  fetchPlatforms: () => Promise<void>;
  connectPlatform: (type: PlatformType, credentials: any) => Promise<void>;
  disconnectPlatform: (id: string) => Promise<void>;
  syncPlatform: (id: string) => Promise<void>;
}

export const usePlatformStore = create<PlatformState>()(
  devtools(
    persist(
      (set, get) => ({
        platforms: [],
        isLoading: false,
        error: null,

        setPlatforms: (platforms) => {
          set({ platforms });
        },

        addPlatform: (platform) => {
          set((state) => ({
            platforms: [...state.platforms, platform],
          }));
        },

        updatePlatform: (id, updates) => {
          set((state) => ({
            platforms: state.platforms.map((p) =>
              p.id === id ? { ...p, ...updates } : p,
            ),
          }));
        },

        removePlatform: (id) => {
          set((state) => ({
            platforms: state.platforms.filter((p) => p.id !== id),
          }));
        },

        setLoading: (isLoading) => {
          set({ isLoading });
        },

        setError: (error) => {
          set({ error });
        },

        fetchPlatforms: async () => {
          const { setLoading, setError, setPlatforms } = get();

          try {
            setLoading(true);
            setError(null);

            const response = await fetch("/api/platforms");

            if (!response.ok) {
              throw new Error("Failed to fetch platforms");
            }

            const data = await response.json();

            setPlatforms(data.platforms);
          } catch (error: any) {
            logger.error("Failed to fetch platforms", error);
            setError(error.message);
          } finally {
            setLoading(false);
          }
        },

        connectPlatform: async (type, credentials) => {
          const { setLoading, setError, addPlatform } = get();

          try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/platforms/${type}/connect`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(credentials),
            });

            if (!response.ok) {
              const error = await response.json();

              throw new Error(error.message || "Failed to connect platform");
            }

            const platform = await response.json();

            addPlatform(platform);

            logger.info(`Platform connected: ${type}`);
          } catch (error: any) {
            logger.error("Failed to connect platform", error);
            setError(error.message);
            throw error;
          } finally {
            setLoading(false);
          }
        },

        disconnectPlatform: async (id) => {
          const { setLoading, setError, removePlatform, platforms } = get();
          const platform = platforms.find((p) => p.id === id);

          if (!platform) {
            setError("Platform not found");

            return;
          }

          try {
            setLoading(true);
            setError(null);

            const response = await fetch(
              `/api/platforms/${platform.type}/disconnect`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ platformId: id }),
              },
            );

            if (!response.ok) {
              throw new Error("Failed to disconnect platform");
            }

            removePlatform(id);
            logger.info(`Platform disconnected: ${platform.type}`);
          } catch (error: any) {
            logger.error("Failed to disconnect platform", error);
            setError(error.message);
            throw error;
          } finally {
            setLoading(false);
          }
        },

        syncPlatform: async (id) => {
          const { setError, updatePlatform, platforms } = get();
          const platform = platforms.find((p) => p.id === id);

          if (!platform) {
            setError("Platform not found");

            return;
          }

          try {
            updatePlatform(id, { status: PlatformStatus.SYNCING });

            const response = await fetch(
              `/api/platforms/${platform.type}/sync`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ platformId: id }),
              },
            );

            if (!response.ok) {
              throw new Error("Failed to sync platform");
            }

            const result = await response.json();

            updatePlatform(id, {
              status: PlatformStatus.CONNECTED,
              lastSyncedAt: new Date(result.syncedAt),
            });

            logger.info(`Platform synced: ${platform.type}`);
          } catch (error: any) {
            logger.error("Failed to sync platform", error);
            updatePlatform(id, { status: PlatformStatus.ERROR });
            setError(error.message);
            throw error;
          }
        },
      }),
      {
        name: "platform-storage",
        partialize: (state) => ({ platforms: state.platforms }),
      },
    ),
  ),
);
