// Refactored Campaign Store using slice pattern

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

import { createLoadingSlice, LoadingSlice } from "./slices/loadingSlice";
import { createErrorSlice, ErrorSlice } from "./slices/errorSlice";
import {
  createCampaignDataSlice,
  CampaignDataSlice,
} from "./slices/campaignDataSlice";
import {
  createCampaignFilterSlice,
  CampaignFilterSlice,
} from "./slices/campaignFilterSlice";
import {
  createPaginationSlice,
  PaginationSlice,
} from "./slices/paginationSlice";
import {
  createCampaignActionsSlice,
  CampaignActionsSlice,
} from "./slices/campaignActionsSlice";

// Combined store type
export type CampaignStoreState = LoadingSlice &
  ErrorSlice &
  CampaignDataSlice &
  CampaignFilterSlice &
  CampaignActionsSlice &
  PaginationSlice;

// Create the store
export const useCampaignStore = create<CampaignStoreState>()(
  devtools(
    persist(
      (set, get, api) => ({
        // Combine all slices
        ...createLoadingSlice(set, get, api),
        ...createErrorSlice(set, get, api),
        ...createCampaignDataSlice(set, get, api),
        ...createCampaignFilterSlice(set, get, api),
        ...createCampaignActionsSlice(set, get, api),
        ...createPaginationSlice(set, get, api),
      }),
      {
        name: "campaign-store",
        // Only persist non-sensitive data
        partialize: (state) => ({
          filters: state.filters,
          lastSync: state.lastSync,
          pagination: state.pagination,
        }),
      },
    ),
  ),
);
