import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Progress } from "@heroui/progress";
import {
  FaArrowUp,
  FaArrowDown,
  FaGoogle,
  FaFacebook,
  FaInstagram,
} from "react-icons/fa";
import { SiNaver } from "react-icons/si";

import DemoButton from "./DemoButton";

import { title } from "@/components/primitives";

export default function DemoPage() {
  const mockData = {
    totalSpend: "₩3,456,789",
    totalRevenue: "₩12,345,678",
    roas: 3.57,
    campaigns: [
      {
        platform: "Google Ads",
        spend: "₩1,234,567",
        revenue: "₩4,567,890",
        change: 12.5,
        icon: <FaGoogle />,
      },
      {
        platform: "Facebook Ads",
        spend: "₩987,654",
        revenue: "₩3,456,789",
        change: -5.2,
        icon: <FaFacebook />,
      },
      {
        platform: "Instagram Ads",
        spend: "₩654,321",
        revenue: "₩2,345,678",
        change: 8.7,
        icon: <FaInstagram />,
      },
      {
        platform: "Naver Ads",
        spend: "₩580,247",
        revenue: "₩1,975,321",
        change: 15.3,
        icon: <SiNaver />,
      },
    ],
  };

  return (
    <div className="container mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className={title({ size: "md" })}>대시보드 데모</h1>
        <p className="text-default-500 mt-2">
          실제 대시보드의 주요 기능을 미리 체험해보세요
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardBody>
            <p className="text-sm text-default-500">총 광고비</p>
            <p className="text-2xl font-bold">{mockData.totalSpend}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-default-500">총 매출</p>
            <p className="text-2xl font-bold text-success">
              {mockData.totalRevenue}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-default-500">ROAS</p>
            <p className="text-2xl font-bold text-primary">{mockData.roas}x</p>
          </CardBody>
        </Card>
      </div>

      {/* Platform Performance */}
      <Card className="mb-8">
        <CardHeader>
          <h3 className="text-lg font-semibold">플랫폼별 성과</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {mockData.campaigns.map((campaign, index) => (
              <div
                key={index}
                className="border-b last:border-0 pb-4 last:pb-0"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{campaign.icon}</div>
                    <div>
                      <p className="font-medium">{campaign.platform}</p>
                      <p className="text-sm text-default-500">
                        광고비: {campaign.spend} | 매출: {campaign.revenue}
                      </p>
                    </div>
                  </div>
                  <Chip
                    color={campaign.change > 0 ? "success" : "danger"}
                    startContent={
                      campaign.change > 0 ? <FaArrowUp /> : <FaArrowDown />
                    }
                    variant="flat"
                  >
                    {Math.abs(campaign.change)}%
                  </Chip>
                </div>
                <Progress
                  className="mt-2"
                  color="primary"
                  size="sm"
                  value={75 + index * 5}
                />
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* CTA */}
      <div className="text-center">
        <p className="text-default-500 mb-4">
          이것은 실제 대시보드의 일부 기능만을 보여주는 데모입니다.
        </p>
        <DemoButton />
      </div>
    </div>
  );
}
