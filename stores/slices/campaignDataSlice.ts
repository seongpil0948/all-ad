// Campaign data slice

import { StateCreator } from "zustand";

import { Campaign, CampaignStats } from "@/types/campaign.types";

export interface CampaignDataSlice {
  campaigns: Campaign[];
  stats: CampaignStats;
  lastSync: Date | null;
  setCampaigns: (campaigns: Campaign[]) => void;
  setStats: (stats: CampaignStats) => void;
  setLastSync: (date: Date | null) => void;
}

const initialStats: CampaignStats = {
  totalCampaigns: 0,
  activeCampaigns: 0,
  totalBudget: 0,
  totalSpend: 0,
  totalClicks: 0,
  totalImpressions: 0,
  platforms: 0,
};

export const createCampaignDataSlice: StateCreator<
  CampaignDataSlice,
  [],
  [],
  CampaignDataSlice
> = (set) => ({
  campaigns: [],
  stats: initialStats,
  lastSync: null,
  setCampaigns: (campaigns) => set({ campaigns }),
  setStats: (stats) => set({ stats }),
  setLastSync: (lastSync) => set({ lastSync }),
});
