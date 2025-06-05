// Campaign filter slice

import { StateCreator } from "zustand";

import { PlatformType } from "@/types";

export interface CampaignFilters {
  platform?: PlatformType;
  status?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface CampaignFilterSlice {
  filters: CampaignFilters;
  setFilters: (filters: CampaignFilters) => void;
  resetFilters: () => void;
}

export const createCampaignFilterSlice: StateCreator<
  CampaignFilterSlice,
  [],
  [],
  CampaignFilterSlice
> = (set) => ({
  filters: {},
  setFilters: (filters) => set({ filters }),
  resetFilters: () => set({ filters: {} }),
});
