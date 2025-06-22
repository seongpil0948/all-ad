import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

import {
  createAnalyticsDataSlice,
  AnalyticsDataSlice,
} from "./slices/analyticsDataSlice";
import {
  createAnalyticsActionsSlice,
  AnalyticsActionsSlice,
} from "./slices/analyticsActionsSlice";
import { createLoadingSlice, LoadingSlice } from "./slices/loadingSlice";
import { createErrorSlice, ErrorSlice } from "./slices/errorSlice";

export type AnalyticsState = AnalyticsDataSlice &
  AnalyticsActionsSlice &
  LoadingSlice &
  ErrorSlice;

export const useAnalyticsStore = create<AnalyticsState>()(
  devtools(
    persist(
      (set, get, api) => ({
        // Slice states
        ...createAnalyticsDataSlice(set, get, api),
        ...createAnalyticsActionsSlice(set, get, api),
        ...createLoadingSlice(set, get, api),
        ...createErrorSlice(set, get, api),
      }),
      {
        name: "analytics-store",
        partialize: (state) => ({
          dateRange: state.dateRange,
        }),
      },
    ),
    {
      name: "AnalyticsStore",
    },
  ),
);
