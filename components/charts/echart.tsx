"use client";

import { useEffect, useMemo, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import * as echarts from "echarts/core";
import type { EChartsCoreOption, ComposeOption } from "echarts/core";
import type {
  LineSeriesOption,
  BarSeriesOption,
  PieSeriesOption,
} from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
} from "echarts/components";
import { LineChart, BarChart, PieChart } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";

import { EChartsProps } from "@/types/components";
import { useDictionary } from "@/hooks/use-dictionary";

// Register required components
echarts.use([
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  LineChart,
  BarChart,
  PieChart,
  CanvasRenderer,
]);

export function EChart({
  option,
  style,
  className,
  aspectRatio,
}: EChartsProps & { "data-testid"?: string; aspectRatio?: number }) {
  const { dictionary: dict } = useDictionary();
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const prefersReducedMotion = useReducedMotion();

  // Merge option with reduced-motion preferences without mutating input
  type ECSeries = LineSeriesOption | BarSeriesOption | PieSeriesOption;
  type ECOption = ComposeOption<ECSeries>;

  const mergedOption: EChartsCoreOption = useMemo(() => {
    const disableAnim = !!prefersReducedMotion;
    const src = option as ECOption;
    const base: ECOption = { ...src, animation: !disableAnim };
    const srcSeries = src.series;
    if (Array.isArray(srcSeries)) {
      base.series = srcSeries.map((s) => ({ ...s, animation: !disableAnim }));
    } else if (srcSeries) {
      base.series = { ...srcSeries, animation: !disableAnim } as ECSeries;
    }
    return base as EChartsCoreOption;
  }, [option, prefersReducedMotion]);

  useEffect(() => {
    if (!chartRef.current) return;
    chartInstance.current = echarts.init(chartRef.current);

    // Observe container size for responsive resizing
    const ro = new ResizeObserver(() => {
      chartInstance.current?.resize();
    });
    ro.observe(chartRef.current);

    const onWindowResize = () => chartInstance.current?.resize();
    window.addEventListener("resize", onWindowResize);

    return () => {
      window.removeEventListener("resize", onWindowResize);
      ro.disconnect();
      chartInstance.current?.dispose();
    };
  }, []);

  useEffect(() => {
    // Update chart when option changes
    if (chartInstance.current) {
      chartInstance.current.setOption(mergedOption, true);
    }
  }, [mergedOption]);

  return (
    <div
      ref={chartRef}
      className={className}
      style={{ ...(style || {}), ...(aspectRatio ? { aspectRatio } : {}) }}
      data-testid="echart"
      role="img"
      aria-label={dict.nav.analytics}
    />
  );
}
