"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Skeleton } from "@heroui/skeleton";

import { EChart } from "@/components/charts/echart";
import { CHART_OPTIONS, KEY_METRICS } from "@/constants/analytics";
import { ChartSkeleton } from "@/components/common/skeletons";

export function AnalyticsCharts() {
  const [isLoading, setIsLoading] = useState(true);

  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton height="h-80" />
        <ChartSkeleton height="h-80" />
        <ChartSkeleton height="h-80" />
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
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">월별 추이</h3>
        </CardHeader>
        <CardBody>
          <EChart
            option={CHART_OPTIONS.LINE_CHART}
            style={{ height: "300px" }}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">채널별 성과</h3>
        </CardHeader>
        <CardBody>
          <EChart
            option={CHART_OPTIONS.BAR_CHART}
            style={{ height: "300px" }}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">예산 분배</h3>
        </CardHeader>
        <CardBody>
          <EChart
            option={CHART_OPTIONS.PIE_CHART}
            style={{ height: "300px" }}
          />
        </CardBody>
      </Card>

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
    </div>
  );
}
