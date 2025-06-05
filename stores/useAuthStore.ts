// Refactored Auth Store using slice pattern

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

import { createLoadingSlice, LoadingSlice } from "./slices/loadingSlice";
import { createAuthDataSlice, AuthDataSlice } from "./slices/authDataSlice";
import {
  createAuthActionsSlice,
  AuthActionsSlice,
} from "./slices/authActionsSlice";

// Combined store type
export type AuthStoreState = LoadingSlice & AuthDataSlice & AuthActionsSlice;

// Create the store
export const useAuthStore = create<AuthStoreState>()(
  devtools(
    persist(
      (set, get, api) => ({
        // Combine all slices
        ...createLoadingSlice(set, get, api),
        ...createAuthDataSlice(set, get, api),
        ...createAuthActionsSlice(set, get, api),
      }),
      {
        name: "auth-store",
        // Don't persist user data for security
        partialize: () => ({}),
      },
    ),
  ),
);
