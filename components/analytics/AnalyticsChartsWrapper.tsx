"use client";

import dynamic from "next/dynamic";

import { ChartSkeleton } from "@/components/common/skeletons";

// Dynamically import heavy chart components
export const AnalyticsCharts = dynamic(
  () =>
    import("@/components/analytics/AnalyticsCharts").then((mod) => ({
      default: mod.AnalyticsCharts,
    })),
  {
    loading: () => <ChartSkeleton className="h-96" />,
    ssr: false, // Charts are client-side only
  },
);
