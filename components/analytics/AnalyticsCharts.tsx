"use client";

import { useState, useEffect, useMemo, memo, useTransition } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Skeleton } from "@heroui/skeleton";

import { EChart } from "@/components/charts/echart";
import { CHART_OPTIONS, KEY_METRICS } from "@/constants/analytics";
import { ChartSkeleton } from "@/components/common/skeletons";

// Memoized chart components
const ChartCard = memo(
  ({
    title,
    option,
    height = "300px",
  }: {
    title: string;
    option: Record<string, unknown>;
    height?: string;
  }) => (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">{title}</h3>
      </CardHeader>
      <CardBody>
        <EChart option={option} style={{ height }} />
      </CardBody>
    </Card>
  ),
);

ChartCard.displayName = "ChartCard";

const MetricsCard = memo(() => (
  <Card>
    <CardHeader>
      <h3 className="text-lg font-semibold">주요 지표</h3>
    </CardHeader>
    <CardBody>
      <div className="space-y-4">
        {KEY_METRICS.map((metric, index) => (
          <div key={index} className="flex justify-between">
            <span className="text-default-600">{metric.label}</span>
            <span className="font-semibold">{metric.value}</span>
          </div>
        ))}
      </div>
    </CardBody>
  </Card>
));

MetricsCard.displayName = "MetricsCard";

const MetricsSkeleton = memo(() => (
  <Card className="p-6">
    <div className="space-y-4">
      <Skeleton className="w-32 rounded-lg">
        <div className="h-4 w-32 rounded-lg bg-default-200" />
      </Skeleton>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex justify-between">
          <Skeleton className="w-24 rounded-lg">
            <div className="h-3 w-24 rounded-lg bg-default-200" />
          </Skeleton>
          <Skeleton className="w-20 rounded-lg">
            <div className="h-3 w-20 rounded-lg bg-default-200" />
          </Skeleton>
        </div>
      ))}
    </div>
  </Card>
));

MetricsSkeleton.displayName = "MetricsSkeleton";

export function AnalyticsCharts() {
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  // Effect: Simulate data loading - separate concern
  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        setIsLoading(false);
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Memoize chart configurations
  const chartConfigs = useMemo(
    () => [
      { title: "월별 추이", option: CHART_OPTIONS.LINE_CHART },
      { title: "채널별 성과", option: CHART_OPTIONS.BAR_CHART },
      { title: "예산 분배", option: CHART_OPTIONS.PIE_CHART },
    ],
    [],
  );

  if (isLoading || isPending) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton height="h-80" />
        <ChartSkeleton height="h-80" />
        <ChartSkeleton height="h-80" />
        <MetricsSkeleton />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {chartConfigs.map((config) => (
        <ChartCard
          key={config.title}
          option={config.option}
          title={config.title}
        />
      ))}
      <MetricsCard />
    </div>
  );
}
