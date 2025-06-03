// Dashboard state management using Zustand

import { create } from "zustand";
import { devtools } from "zustand/middleware";

import {
  DashboardFilter,
  DashboardMetrics,
  PlatformSummary,
  DashboardDateRange,
  PlatformType,
} from "@/types";
import logger from "@/utils/logger";

interface DashboardState {
  filter: DashboardFilter;
  metrics: DashboardMetrics | null;
  platformSummaries: PlatformSummary[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setFilter: (filter: Partial<DashboardFilter>) => void;
  setMetrics: (metrics: DashboardMetrics) => void;
  setPlatformSummaries: (summaries: PlatformSummary[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Async actions
  fetchDashboardData: () => Promise<void>;
  refreshPlatform: (platform: PlatformType) => Promise<void>;
}

// Helper function to get date range
const getDateRange = (preset: string): DashboardDateRange => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case "today":
      return {
        start: today,
        end: now,
        preset: "today",
      };
    case "yesterday":
      const yesterday = new Date(today);

      yesterday.setDate(yesterday.getDate() - 1);

      return {
        start: yesterday,
        end: today,
        preset: "yesterday",
      };
    case "last7days":
      const last7days = new Date(today);

      last7days.setDate(last7days.getDate() - 7);

      return {
        start: last7days,
        end: now,
        preset: "last7days",
      };
    case "last30days":
      const last30days = new Date(today);

      last30days.setDate(last30days.getDate() - 30);

      return {
        start: last30days,
        end: now,
        preset: "last30days",
      };
    case "thisMonth":
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      return {
        start: thisMonthStart,
        end: now,
        preset: "thisMonth",
      };
    case "lastMonth":
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      const lastMonthStart = new Date(
        lastMonthEnd.getFullYear(),
        lastMonthEnd.getMonth(),
        1,
      );

      return {
        start: lastMonthStart,
        end: lastMonthEnd,
        preset: "lastMonth",
      };
    default:
      return getDateRange("last7days");
  }
};

export const useDashboardStore = create<DashboardState>()(
  devtools((set, get) => ({
    filter: {
      dateRange: getDateRange("last7days"),
      platforms: undefined,
      accounts: undefined,
      campaigns: undefined,
    },
    metrics: null,
    platformSummaries: [],
    isLoading: false,
    error: null,

    setFilter: (newFilter) => {
      set((state) => ({
        filter: {
          ...state.filter,
          ...newFilter,
          dateRange: newFilter.dateRange
            ? typeof newFilter.dateRange === "string"
              ? getDateRange(newFilter.dateRange)
              : newFilter.dateRange
            : state.filter.dateRange,
        },
      }));

      // Auto-fetch when filter changes
      get().fetchDashboardData();
    },

    setMetrics: (metrics) => {
      set({ metrics });
    },

    setPlatformSummaries: (summaries) => {
      set({ platformSummaries: summaries });
    },

    setLoading: (isLoading) => {
      set({ isLoading });
    },

    setError: (error) => {
      set({ error });
    },

    fetchDashboardData: async () => {
      const { setLoading, setError, setMetrics, setPlatformSummaries, filter } =
        get();

      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          start: filter.dateRange.start.toISOString(),
          end: filter.dateRange.end.toISOString(),
          ...(filter.platforms && { platforms: filter.platforms.join(",") }),
          ...(filter.accounts && { accounts: filter.accounts.join(",") }),
          ...(filter.campaigns && { campaigns: filter.campaigns.join(",") }),
        });

        const response = await fetch(`/api/dashboard?${params}`);

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const data = await response.json();

        setMetrics(data.metrics);
        setPlatformSummaries(data.platformSummaries);

        logger.info("Dashboard data fetched successfully");
      } catch (error: any) {
        logger.error("Failed to fetch dashboard data", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    },

    refreshPlatform: async (platform) => {
      const { setError, platformSummaries, setPlatformSummaries } = get();

      try {
        // Update platform summary to show loading
        setPlatformSummaries(
          platformSummaries.map((summary) =>
            summary.platform === platform
              ? {
                  ...summary,
                  syncStatus: { ...summary.syncStatus, isLoading: true },
                }
              : summary,
          ),
        );

        const response = await fetch(`/api/platforms/${platform}/sync`, {
          method: "POST",
        });

        if (!response.ok) {
          throw new Error(`Failed to refresh ${platform} data`);
        }

        // Refetch dashboard data after sync
        await get().fetchDashboardData();

        logger.info(`Platform ${platform} refreshed successfully`);
      } catch (error: any) {
        logger.error(`Failed to refresh platform ${platform}`, error);
        setError(error.message);

        // Update platform summary to show error
        setPlatformSummaries(
          platformSummaries.map((summary) =>
            summary.platform === platform
              ? {
                  ...summary,
                  syncStatus: {
                    ...summary.syncStatus,
                    isLoading: false,
                    error: error.message,
                  },
                }
              : summary,
          ),
        );
      }
    },
  })),
);
