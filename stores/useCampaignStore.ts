// Campaign Dashboard Store

import { create } from "zustand";
import { devtools } from "zustand/middleware";

import { createLoadingSlice, LoadingSlice } from "./slices/loadingSlice";
import { createErrorSlice, ErrorSlice } from "./slices/errorSlice";
import {
  createCampaignDataSlice,
  CampaignDataSlice,
} from "./slices/campaignDataSlice";
import {
  createCampaignActionsSlice,
  CampaignActionsSlice,
} from "./slices/campaignActionsSlice";

// Combined store type
export type CampaignStoreState = LoadingSlice &
  ErrorSlice &
  CampaignDataSlice &
  CampaignActionsSlice;

// Create the store
export const useCampaignStore = create<CampaignStoreState>()(
  devtools(
    (set, get, api) => ({
      // Combine all slices
      ...createLoadingSlice(set, get, api),
      ...createErrorSlice(set, get, api),
      ...createCampaignDataSlice(set, get, api),
      ...createCampaignActionsSlice(set, get, api),
    }),
    {
      name: "campaign-store",
    },
  ),
);
