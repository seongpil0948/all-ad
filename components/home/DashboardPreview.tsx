"use client";

import { Card, CardBody } from "@heroui/card";
import { motion } from "framer-motion";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";

interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
}

const MetricCard = ({ title, value, change, changeLabel }: MetricCardProps) => {
  const isPositive = change >= 0;

  return (
    <Card className="bg-white/80 dark:bg-default-100/80 backdrop-blur">
      <CardBody className="gap-2">
        <p className="text-sm text-default-500">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
        <div className="flex items-center gap-1">
          {isPositive ? (
            <FaArrowUp className="w-3 h-3 text-success" />
          ) : (
            <FaArrowDown className="w-3 h-3 text-danger" />
          )}
          <span
            className={`text-sm ${isPositive ? "text-success" : "text-danger"}`}
          >
            {Math.abs(change)}%
          </span>
          <span className="text-xs text-default-400">{changeLabel}</span>
        </div>
      </CardBody>
    </Card>
  );
};

export const DashboardPreview = () => {
  const metrics = [
    {
      title: "총 광고비",
      value: "₩12,450,000",
      change: -5.2,
      changeLabel: "전월 대비",
    },
    {
      title: "총 클릭수",
      value: "145.2K",
      change: 12.5,
      changeLabel: "전월 대비",
    },
    {
      title: "평균 CPC",
      value: "₩1,230",
      change: -8.7,
      changeLabel: "전월 대비",
    },
    {
      title: "전환율",
      value: "3.45%",
      change: 15.3,
      changeLabel: "전월 대비",
    },
  ];

  return (
    <div className="relative">
      {/* Mock dashboard background */}
      <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-secondary/5 rounded-xl" />

      {/* Dashboard content */}
      <div className="relative p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">광고 성과 개요</h3>
          <p className="text-sm text-default-500">2025년 1월 성과 리포트</p>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((metric, index) => (
            <motion.div
              key={index}
              animate={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <MetricCard {...metric} />
            </motion.div>
          ))}
        </div>

        {/* Mock chart area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-white/80 dark:bg-default-100/80 backdrop-blur">
            <CardBody>
              <h4 className="text-lg font-semibold mb-4">플랫폼별 성과</h4>
              <div className="h-48 flex items-center justify-center bg-default-100 rounded-lg">
                <p className="text-default-400">차트 영역</p>
              </div>
            </CardBody>
          </Card>
          <Card className="bg-white/80 dark:bg-default-100/80 backdrop-blur">
            <CardBody>
              <h4 className="text-lg font-semibold mb-4">일별 광고비 추이</h4>
              <div className="h-48 flex items-center justify-center bg-default-100 rounded-lg">
                <p className="text-default-400">차트 영역</p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
