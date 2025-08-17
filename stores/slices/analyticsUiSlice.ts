// Analytics UI state slice

import { StateCreator } from "zustand";
import { TimeSeriesData } from "./analyticsDataSlice";

export type MetricKey = keyof TimeSeriesData;
export type ChartType = "line" | "bar" | "pie";

export interface AnalyticsUiSlice {
  selectedMetric: MetricKey;
  selectedChartType: ChartType;
  dateRange: {
    start: string; // ISO 8601 date string
    end: string; // ISO 8601 date string
  };
  setSelectedMetric: (metric: MetricKey) => void;
  setSelectedChartType: (type: ChartType) => void;
  setDateRange: (range: { start: string; end: string }) => void;
}

const getISODateString = (date: Date) => date.toISOString().split("T")[0];

export const createAnalyticsUiSlice: StateCreator<
  AnalyticsUiSlice,
  [],
  [],
  AnalyticsUiSlice
> = (set) => ({
  selectedMetric: "impressions",
  selectedChartType: "line",
  dateRange: {
    start: getISODateString(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
    end: getISODateString(new Date()),
  },
  setSelectedMetric: (metric) => set({ selectedMetric: metric }),
  setSelectedChartType: (type) => set({ selectedChartType: type }),
  setDateRange: (range) => set({ dateRange: range }),
});
