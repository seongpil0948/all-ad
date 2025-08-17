"use client";

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export type DashboardTabKey = "campaigns" | "platforms" | "team";

interface DashboardUIState {
  selectedTab: DashboardTabKey;
  setSelectedTab: (key: DashboardTabKey) => void;
}

export const useDashboardUIStore = create<DashboardUIState>()(
  devtools(
    persist(
      (set) => ({
        selectedTab: "campaigns",
        setSelectedTab: (key) => set({ selectedTab: key }),
      }),
      { name: "dashboard-ui-store" },
    ),
    { name: "DashboardUIStore" },
  ),
);
