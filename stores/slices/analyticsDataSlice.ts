import { StateCreator } from "zustand";

import { AnalyticsSummary, PlatformAnalytics } from "@/lib/data/analytics";

export interface TimeSeriesData {
  impressions: Array<{ date: string; value: number }>;
  clicks: Array<{ date: string; value: number }>;
  cost: Array<{ date: string; value: number }>;
  conversions: Array<{ date: string; value: number }>;
  revenue: Array<{ date: string; value: number }>;
}

export interface AnalyticsDataSlice {
  summary: AnalyticsSummary | null;
  platformData: PlatformAnalytics[];
  timeSeriesData: TimeSeriesData | null;
  setSummary: (summary: AnalyticsSummary) => void;
  setPlatformData: (data: PlatformAnalytics[]) => void;
  setTimeSeriesData: (data: TimeSeriesData) => void;
}

export const createAnalyticsDataSlice: StateCreator<
  AnalyticsDataSlice,
  [],
  [],
  AnalyticsDataSlice
> = (set) => ({
  summary: null,
  platformData: [],
  timeSeriesData: null,
  setSummary: (summary) => set({ summary }),
  setPlatformData: (data) => set({ platformData: data }),
  setTimeSeriesData: (data) => set({ timeSeriesData: data }),
});
