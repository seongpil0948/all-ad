// Campaign actions slice

import { StateCreator } from "zustand";
import { addToast } from "@heroui/toast";

import { CampaignStoreState } from "../useCampaignStore";
import {
  getCampaigns,
  updateCampaignBudget,
  updateCampaignStatus,
} from "@/app/[lang]/(private)/dashboard/actions";
import log from "@/utils/logger";

const ITEMS_PER_PAGE = 20;

export interface CampaignActionsSlice {
  fetchCampaigns: (page?: number) => Promise<void>;
  applyFilters: (newFilters: Record<string, unknown>) => Promise<void>;
  updateBudget: (campaignId: string, newBudget: number) => Promise<void>;
  toggleStatus: (campaignId: string, currentStatus: boolean) => Promise<void>;
}

export const createCampaignActionsSlice: StateCreator<
  CampaignStoreState,
  [],
  [],
  CampaignActionsSlice
> = (set, get) => ({
  fetchCampaigns: async (page = 1) => {
    const { setIsLoading, setCampaigns, addCampaigns, filters } = get();
    setIsLoading(true);
    try {
      const { campaigns: newCampaigns } = await getCampaigns({
        filters,
        page,
        limit: ITEMS_PER_PAGE,
      });
      if (page === 1) {
        setCampaigns(newCampaigns);
      } else {
        addCampaigns(newCampaigns);
      }
    } catch (error) {
      log.error("Failed to fetch campaigns", error);
      addToast({
        title: "Error",
        description: "Failed to load campaigns",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  },

  applyFilters: async (newFilters) => {
    const { setFilters, fetchCampaigns } = get();
    setFilters(newFilters);
    await fetchCampaigns(1); // Reset to page 1 on filter change
  },

  updateBudget: async (campaignId, newBudget) => {
    const { fetchCampaigns } = get();
    try {
      await updateCampaignBudget(campaignId, newBudget);
      addToast({
        title: "Success",
        description: "Budget updated successfully",
        color: "success",
      });
      await fetchCampaigns(1); // Refresh data
    } catch (error) {
      log.error("Failed to update budget", error);
      addToast({
        title: "Error",
        description: "Failed to update budget",
        color: "danger",
      });
    }
  },

  toggleStatus: async (campaignId, currentStatus) => {
    const { fetchCampaigns } = get();
    try {
      await updateCampaignStatus(campaignId, !currentStatus);
      addToast({
        title: "Success",
        description: "Campaign status changed",
        color: "success",
      });
      await fetchCampaigns(1); // Refresh data
    } catch (error) {
      log.error("Failed to toggle campaign status", error);
      addToast({
        title: "Error",
        description: "Failed to change status",
        color: "danger",
      });
    }
  },
});
