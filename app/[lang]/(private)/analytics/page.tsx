import { redirect } from "next/navigation";
import { Suspense } from "react";

import { createClient } from "@/utils/supabase/server";
import { getTeamId } from "@/utils/auth/server";
import { AnalyticsServer } from "@/components/analytics/AnalyticsServer";
import { AnalyticsCharts } from "@/components/analytics/AnalyticsChartsWrapper";
import { Container } from "@/components/layouts/Container";
import {
  MetricCardSkeleton,
  ChartSkeleton,
} from "@/components/common/skeletons";
import { getDictionary, type Locale } from "@/app/[lang]/dictionaries";

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${lang}/login`);
  }

  const teamId = await getTeamId();

  if (!teamId) {
    redirect(`/${lang}/team`);
  }

  // Default date range: last 30 days
  const dateRange = {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
  };

  return (
    <Container className="py-8">
      <h1 className="text-3xl font-bold mb-8">{dict.nav.analytics}</h1>

      {/* Server component with streaming support */}
      <Suspense
        fallback={
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
            </div>
            <ChartSkeleton className="h-96" />
          </div>
        }
      >
        <AnalyticsServer
          dateRange={dateRange}
          teamId={teamId}
          locale={lang as Locale}
        />
      </Suspense>

      {/* Client-side charts with independent suspense */}
      <Suspense fallback={<ChartSkeleton className="h-96 mt-8" />}>
        <div className="mt-8">
          <AnalyticsCharts />
        </div>
      </Suspense>
    </Container>
  );
}
