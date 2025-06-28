// Error handling slice for stores

import { StateCreator } from "zustand";

export interface ErrorSlice {
  error: string | null;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const createErrorSlice: StateCreator<ErrorSlice, [], [], ErrorSlice> = (
  set,
) => ({
  error: null,
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
});
