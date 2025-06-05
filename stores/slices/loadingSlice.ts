// Loading slice for stores

import { StateCreator } from "zustand";

export interface LoadingSlice {
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

export const createLoadingSlice: StateCreator<
  LoadingSlice,
  [],
  [],
  LoadingSlice
> = (set) => ({
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
});
