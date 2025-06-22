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
  dateRange: {
    start: Date;
    end: Date;
  };
  setSummary: (summary: AnalyticsSummary) => void;
  setPlatformData: (data: PlatformAnalytics[]) => void;
  setTimeSeriesData: (data: TimeSeriesData) => void;
  setDateRange: (range: { start: Date; end: Date }) => void;
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
  dateRange: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
  },
  setSummary: (summary) => set({ summary }),
  setPlatformData: (data) => set({ platformData: data }),
  setTimeSeriesData: (data) => set({ timeSeriesData: data }),
  setDateRange: (range) => set({ dateRange: range }),
});
