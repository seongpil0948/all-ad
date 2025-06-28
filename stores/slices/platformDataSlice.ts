// Platform data slice

import { StateCreator } from "zustand";

import { PlatformCredential, PlatformType } from "@/types";

export interface PlatformDataSlice {
  credentials: PlatformCredential[];
  syncProgress: Record<PlatformType, number>;
  setCredentials: (credentials: PlatformCredential[]) => void;
  setSyncProgress: (platform: PlatformType, progress: number) => void;
}

export const createPlatformDataSlice: StateCreator<
  PlatformDataSlice,
  [],
  [],
  PlatformDataSlice
> = (set) => ({
  credentials: [],
  syncProgress: {
    facebook: 0,
    google: 0,
    kakao: 0,
    naver: 0,
    coupang: 0,
  },
  setCredentials: (credentials) => set({ credentials }),
  setSyncProgress: (platform, progress) =>
    set((state) => ({
      syncProgress: { ...state.syncProgress, [platform]: progress },
    })),
});
