// Refactored Team Store using slice pattern

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

import { createLoadingSlice, LoadingSlice } from "./slices/loadingSlice";
import { createErrorSlice, ErrorSlice } from "./slices/errorSlice";
import { createTeamDataSlice, TeamDataSlice } from "./slices/teamDataSlice";
import {
  createTeamActionsSlice,
  TeamActionsSlice,
} from "./slices/teamActionsSlice";

// Combined store type
export type TeamStoreState = LoadingSlice &
  ErrorSlice &
  TeamDataSlice &
  TeamActionsSlice;

// Create the store
export const useTeamStore = create<TeamStoreState>()(
  devtools(
    persist(
      (set, get, api) => ({
        // Combine all slices
        ...createLoadingSlice(set, get, api),
        ...createErrorSlice(set, get, api),
        ...createTeamDataSlice(set, get, api),
        ...createTeamActionsSlice(set, get, api),
      }),
      {
        name: "team-store",
        // Only persist team data, not loading states
        partialize: (state) => ({
          currentTeam: state.currentTeam,
          userRole: state.userRole,
        }),
      },
    ),
  ),
);
