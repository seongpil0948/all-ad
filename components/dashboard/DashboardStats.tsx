"use client";

import { Card, CardBody } from "@heroui/card";
import {
  FaToggleOn,
  FaMoneyBillWave,
  FaLink,
  FaBullhorn,
} from "react-icons/fa";

interface DashboardStatsProps {
  totalCampaigns: number;
  activeCampaigns: number;
  totalBudget: number;
  connectedPlatforms: number;
}

export function DashboardStats({
  totalCampaigns,
  activeCampaigns,
  totalBudget,
  connectedPlatforms,
}: DashboardStatsProps) {
  const stats = [
    {
      title: "전체 캠페인",
      value: totalCampaigns.toLocaleString(),
      icon: FaBullhorn,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "활성 캠페인",
      value: activeCampaigns.toLocaleString(),
      icon: FaToggleOn,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "총 예산",
      value: `₩${totalBudget.toLocaleString()}`,
      icon: FaMoneyBillWave,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "연동된 플랫폼",
      value: `${connectedPlatforms}/5`,
      icon: FaLink,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;

        return (
          <Card key={index}>
            <CardBody className="flex flex-row items-center gap-4">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <Icon className={`text-2xl ${stat.color}`} />
              </div>
              <div className="flex-1">
                <p className="text-small text-default-500">{stat.title}</p>
                <p className="text-2xl font-semibold">{stat.value}</p>
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
