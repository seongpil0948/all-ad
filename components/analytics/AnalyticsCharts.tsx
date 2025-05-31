"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";

import { EChart } from "@/components/charts/echart";
import { CHART_OPTIONS, KEY_METRICS } from "@/constants/analytics";

export function AnalyticsCharts() {
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
