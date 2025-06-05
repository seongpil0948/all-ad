// Campaign actions slice

import { StateCreator } from "zustand";

import { CampaignDataSlice } from "./campaignDataSlice";
import { LoadingSlice } from "./loadingSlice";
import { ErrorSlice } from "./errorSlice";
import { CampaignFilterSlice } from "./campaignFilterSlice";

import { PlatformType } from "@/types";
// Campaign actions slice - uses API endpoints for server-side operations

export interface CampaignActionsSlice {
  fetchCampaigns: () => Promise<void>;
  syncCampaigns: (platform?: PlatformType) => Promise<void>;
  updateCampaignStatus: (
    campaignId: string,
    status: "ENABLED" | "PAUSED",
  ) => Promise<void>;
  updateCampaignBudget: (campaignId: string, budget: number) => Promise<void>;
}

export const createCampaignActionsSlice: StateCreator<
  CampaignDataSlice &
    LoadingSlice &
    ErrorSlice &
    CampaignFilterSlice &
    CampaignActionsSlice,
  [],
  [],
  CampaignActionsSlice
> = (set, get) => ({
  fetchCampaigns: async () => {
    set({ isLoading: true, error: null });

    try {
      const filters = get().filters;
      const params = new URLSearchParams();

      if (filters.platform) {
        params.append("platform", filters.platform);
      }
      if (filters.status !== undefined) {
        params.append("status", filters.status);
      }

      const response = await fetch(`/api/campaigns?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.error || "Failed to fetch campaigns");
      }

      const { campaigns, stats } = await response.json();

      set({
        campaigns,
        stats,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch campaigns",
      });
    }
  },

  syncCampaigns: async (platform?: PlatformType) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ platform }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.error || "Failed to sync campaigns");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Sync failed");
      }

      set({ lastSync: new Date() });

      // Refresh campaigns after sync
      await get().fetchCampaigns();
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to sync campaigns",
      });
    }
  },

  updateCampaignStatus: async (
    campaignId: string,
    status: "ENABLED" | "PAUSED",
  ) => {
    set({ isLoading: true, error: null });

    try {
      const campaign = get().campaigns.find((c) => c.id === campaignId);

      if (!campaign) {
        throw new Error("Campaign not found");
      }

      const response = await fetch(
        `/api/campaigns/${campaign.platform}/${campaignId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.error || "Failed to update campaign status");
      }

      const isActive = status === "ENABLED";

      // Update local state
      const updatedCampaigns = get().campaigns.map((c) =>
        c.id === campaignId ? { ...c, is_active: isActive } : c,
      );

      set({
        campaigns: updatedCampaigns,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update campaign status",
      });
    }
  },

  updateCampaignBudget: async (campaignId: string, budget: number) => {
    set({ isLoading: true, error: null });

    try {
      const campaign = get().campaigns.find((c) => c.id === campaignId);

      if (!campaign) {
        throw new Error("Campaign not found");
      }

      const response = await fetch(
        `/api/campaigns/${campaign.platform}/${campaignId}/budget`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ budget }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.error || "Failed to update campaign budget");
      }

      // Update local state
      const updatedCampaigns = get().campaigns.map((c) =>
        c.id === campaignId ? { ...c, budget } : c,
      );

      set({
        campaigns: updatedCampaigns,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update campaign budget",
      });
    }
  },
});
