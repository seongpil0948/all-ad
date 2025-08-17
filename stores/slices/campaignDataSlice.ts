// Campaign data slice

import { StateCreator } from "zustand";

import { Campaign, CampaignStats } from "@/types/campaign.types";

export interface CampaignDataSlice {
  campaigns: Campaign[];
  stats: CampaignStats | null;
  filters: Record<string, unknown>;
  setCampaigns: (campaigns: Campaign[]) => void;
  setStats: (stats: CampaignStats) => void;
  setFilters: (filters: Record<string, unknown>) => void;
  addCampaigns: (campaigns: Campaign[]) => void;
}

export const createCampaignDataSlice: StateCreator<
  CampaignDataSlice,
  [],
  [],
  CampaignDataSlice
> = (set) => ({
  campaigns: [],
  stats: null,
  filters: { search: "", isActive: undefined, platform: undefined },
  setCampaigns: (campaigns) => set({ campaigns }),
  addCampaigns: (campaigns) =>
    set((state) => ({ campaigns: [...state.campaigns, ...campaigns] })),
  setStats: (stats) => set({ stats }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
});
