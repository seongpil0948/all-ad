"use client";

import { useState } from "react";
import { Card, CardHeader } from "@heroui/card";
import { Tabs, Tab } from "@heroui/tabs";
import { Badge } from "@heroui/badge";
import { FaGoogle, FaFacebook, FaAmazon, FaTiktok } from "react-icons/fa";

import GoogleAdsTest from "./components/GoogleAdsTest";
import MetaAdsTest from "./components/MetaAdsTest";
import AmazonAdsTest from "./components/AmazonAdsTest";
import TikTokAdsTest from "./components/TikTokAdsTest";

export default function LabPage() {
  const [selectedTab, setSelectedTab] = useState("google");

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div>
              <h1 className="text-2xl font-bold">
                광고 플랫폼 API 연동 테스트
              </h1>
              <p className="text-gray-600 mt-1">
                각 플랫폼의 API 연동을 테스트하고 검증합니다.
              </p>
            </div>
            <Badge color="warning" content="테스트 환경" variant="flat">
              <div />
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <Tabs
        aria-label="광고 플랫폼 선택"
        classNames={{
          tabList:
            "gap-6 w-full relative rounded-none p-0 border-b border-divider",
          cursor: "w-full bg-[#22d3ee]",
          tab: "max-w-fit px-0 h-12",
          tabContent: "group-data-[selected=true]:text-[#06b6d4]",
        }}
        selectedKey={selectedTab}
        variant="underlined"
        onSelectionChange={(key) => setSelectedTab(key as string)}
      >
        <Tab
          key="google"
          title={
            <div className="flex items-center gap-2">
              <FaGoogle className="text-red-600" size={20} />
              <span>Google Ads</span>
            </div>
          }
        >
          <div className="mt-6">
            <GoogleAdsTest />
          </div>
        </Tab>

        <Tab
          key="meta"
          title={
            <div className="flex items-center gap-2">
              <FaFacebook className="text-blue-600" size={20} />
              <span>Meta Ads</span>
            </div>
          }
        >
          <div className="mt-6">
            <MetaAdsTest />
          </div>
        </Tab>

        <Tab
          key="amazon"
          title={
            <div className="flex items-center gap-2">
              <FaAmazon className="text-orange-600" size={20} />
              <span>Amazon Ads</span>
            </div>
          }
        >
          <div className="mt-6">
            <AmazonAdsTest />
          </div>
        </Tab>

        <Tab
          key="tiktok"
          title={
            <div className="flex items-center gap-2">
              <FaTiktok className="text-gray-900" size={20} />
              <span>TikTok Ads</span>
            </div>
          }
        >
          <div className="mt-6">
            <TikTokAdsTest />
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
