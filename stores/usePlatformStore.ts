// Refactored Platform Store using slice pattern

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

import { createLoadingSlice, LoadingSlice } from "./slices/loadingSlice";
import { createErrorSlice, ErrorSlice } from "./slices/errorSlice";
import {
  createPlatformDataSlice,
  PlatformDataSlice,
} from "./slices/platformDataSlice";
import {
  createPlatformActionsSlice,
  PlatformActionsSlice,
} from "./slices/platformActionsSlice";

// Combined store type
export type PlatformStoreState = LoadingSlice &
  ErrorSlice &
  PlatformDataSlice &
  PlatformActionsSlice;

// Create the store
export const usePlatformStore = create<PlatformStoreState>()(
  devtools(
    persist(
      (set, get, api) => ({
        // Combine all slices
        ...createLoadingSlice(set, get, api),
        ...createErrorSlice(set, get, api),
        ...createPlatformDataSlice(set, get, api),
        ...createPlatformActionsSlice(set, get, api),
      }),
      {
        name: "platform-store",
        // Only persist credentials data
        partialize: (state) => ({
          credentials: state.credentials,
        }),
      },
    ),
  ),
);
