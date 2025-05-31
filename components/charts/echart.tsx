"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
} from "echarts/components";
import { LineChart, BarChart, PieChart } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";

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

interface EChartsProps {
  option: echarts.EChartsCoreOption;
  style?: React.CSSProperties;
  className?: string;
}

export function EChart({ option, style, className }: EChartsProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      // Initialize chart
      chartInstance.current = echarts.init(chartRef.current);
      chartInstance.current.setOption(option);

      // Handle resize
      const handleResize = () => {
        chartInstance.current?.resize();
      };

      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        chartInstance.current?.dispose();
      };
    }
  }, []);

  useEffect(() => {
    // Update chart when option changes
    if (chartInstance.current) {
      chartInstance.current.setOption(option);
    }
  }, [option]);

  return <div ref={chartRef} className={className} style={style} />;
}
