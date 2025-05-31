"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { EChart } from "@/components/charts/echart";
import { createClient } from "@/utils/supabase/client";

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");

        return;
      }

      setLoading(false);
    };

    checkAuth();
  }, [router]);

  // Line chart option
  const lineChartOption = {
    title: {
      text: "월별 광고 실적",
    },
    tooltip: {
      trigger: "axis",
    },
    legend: {
      data: ["노출수", "클릭수", "전환수"],
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: ["1월", "2월", "3월", "4월", "5월", "6월"],
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        name: "노출수",
        type: "line",
        data: [120000, 132000, 101000, 134000, 90000, 230000],
      },
      {
        name: "클릭수",
        type: "line",
        data: [2200, 1820, 1910, 2340, 2900, 3300],
      },
      {
        name: "전환수",
        type: "line",
        data: [150, 232, 201, 154, 190, 330],
      },
    ],
  };

  // Bar chart option
  const barChartOption = {
    title: {
      text: "채널별 성과",
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
    },
    legend: {},
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "value",
    },
    yAxis: {
      type: "category",
      data: ["Google Ads", "Facebook", "Instagram", "Naver", "Kakao"],
    },
    series: [
      {
        name: "클릭수",
        type: "bar",
        data: [18203, 23489, 29034, 104970, 131744],
      },
    ],
  };

  // Pie chart option
  const pieChartOption = {
    title: {
      text: "예산 분배",
      left: "center",
    },
    tooltip: {
      trigger: "item",
    },
    legend: {
      orient: "vertical",
      left: "left",
    },
    series: [
      {
        name: "예산",
        type: "pie",
        radius: "50%",
        data: [
          { value: 1048, name: "Google Ads" },
          { value: 735, name: "Facebook" },
          { value: 580, name: "Instagram" },
          { value: 484, name: "Naver" },
          { value: 300, name: "Kakao" },
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
      },
    ],
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div>로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">분석</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardBody>
            <p className="text-default-500 text-sm">총 노출수</p>
            <p className="text-2xl font-bold">1,234,567</p>
            <p className="text-success text-sm">+12.5%</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-default-500 text-sm">총 클릭수</p>
            <p className="text-2xl font-bold">45,678</p>
            <p className="text-success text-sm">+8.3%</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-default-500 text-sm">평균 CTR</p>
            <p className="text-2xl font-bold">3.7%</p>
            <p className="text-danger text-sm">-0.2%</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-default-500 text-sm">총 전환수</p>
            <p className="text-2xl font-bold">1,234</p>
            <p className="text-success text-sm">+15.7%</p>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">월별 추이</h3>
          </CardHeader>
          <CardBody>
            <EChart option={lineChartOption} style={{ height: "300px" }} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">채널별 성과</h3>
          </CardHeader>
          <CardBody>
            <EChart option={barChartOption} style={{ height: "300px" }} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">예산 분배</h3>
          </CardHeader>
          <CardBody>
            <EChart option={pieChartOption} style={{ height: "300px" }} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">주요 지표</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-default-600">평균 CPC</span>
                <span className="font-semibold">₩234</span>
              </div>
              <div className="flex justify-between">
                <span className="text-default-600">평균 CPM</span>
                <span className="font-semibold">₩5,678</span>
              </div>
              <div className="flex justify-between">
                <span className="text-default-600">ROAS</span>
                <span className="font-semibold">320%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-default-600">총 지출</span>
                <span className="font-semibold">₩12,345,678</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
