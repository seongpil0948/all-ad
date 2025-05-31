import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { MetricCard } from "@/components/common";
import { AnalyticsCharts } from "@/components/analytics/AnalyticsCharts";
import { ANALYTICS_METRICS } from "@/constants/analytics";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">분석</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          change={ANALYTICS_METRICS.TOTAL_IMPRESSIONS.change}
          label={ANALYTICS_METRICS.TOTAL_IMPRESSIONS.label}
          value={ANALYTICS_METRICS.TOTAL_IMPRESSIONS.value}
        />
        <MetricCard
          change={ANALYTICS_METRICS.TOTAL_CLICKS.change}
          label={ANALYTICS_METRICS.TOTAL_CLICKS.label}
          value={ANALYTICS_METRICS.TOTAL_CLICKS.value}
        />
        <MetricCard
          change={ANALYTICS_METRICS.AVERAGE_CTR.change}
          isNegative={ANALYTICS_METRICS.AVERAGE_CTR.isNegative}
          label={ANALYTICS_METRICS.AVERAGE_CTR.label}
          value={ANALYTICS_METRICS.AVERAGE_CTR.value}
        />
        <MetricCard
          change={ANALYTICS_METRICS.TOTAL_CONVERSIONS.change}
          label={ANALYTICS_METRICS.TOTAL_CONVERSIONS.label}
          value={ANALYTICS_METRICS.TOTAL_CONVERSIONS.value}
        />
      </div>

      <AnalyticsCharts />
    </div>
  );
}
