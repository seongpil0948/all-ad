// Platform filter slice

import { StateCreator } from "zustand";

import { PlatformType } from "@/types";

export interface PlatformFilters {
  isActive?: boolean;
  platform?: PlatformType;
  search?: string;
}

export interface PlatformFilterSlice {
  platformFilters: PlatformFilters;
  setPlatformFilters: (filters: PlatformFilters) => void;
  resetPlatformFilters: () => void;
}

export const createPlatformFilterSlice: StateCreator<
  PlatformFilterSlice,
  [],
  [],
  PlatformFilterSlice
> = (set) => ({
  platformFilters: {},
  setPlatformFilters: (platformFilters) => set({ platformFilters }),
  resetPlatformFilters: () => set({ platformFilters: {} }),
});
