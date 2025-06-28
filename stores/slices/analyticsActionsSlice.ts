import { StateCreator } from "zustand";

import { AnalyticsDataSlice } from "./analyticsDataSlice";
import { LoadingSlice } from "./loadingSlice";
import { ErrorSlice } from "./errorSlice";

import log from "@/utils/logger";

export interface AnalyticsActionsSlice {
  fetchAnalytics: (dateRange: { start: Date; end: Date }) => Promise<void>;
  exportData: (format: "csv" | "excel" | "pdf") => Promise<void>;
}

export const createAnalyticsActionsSlice: StateCreator<
  AnalyticsDataSlice & LoadingSlice & ErrorSlice & AnalyticsActionsSlice,
  [],
  [],
  AnalyticsActionsSlice
> = (set, get) => ({
  fetchAnalytics: async (dateRange) => {
    set({ isLoading: true, error: null });

    try {
      const params = new URLSearchParams({
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString(),
      });

      const response = await fetch(`/api/analytics?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.error || "Failed to fetch analytics");
      }

      const { summary, platformData, timeSeriesData } = await response.json();

      set({
        summary,
        platformData,
        timeSeriesData,
        dateRange,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      log.error("Failed to fetch analytics", error);
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch analytics",
      });
    }
  },

  exportData: async (format) => {
    set({ isLoading: true, error: null });

    try {
      const { dateRange, summary, platformData } = get();

      const response = await fetch("/api/analytics/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          format,
          dateRange,
          summary,
          platformData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.error || "Failed to export data");
      }

      // Handle file download
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = `analytics-${new Date().toISOString().split("T")[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      set({ isLoading: false, error: null });
    } catch (error) {
      log.error("Failed to export analytics data", error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to export data",
      });
    }
  },
});
