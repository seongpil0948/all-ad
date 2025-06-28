"use client";

import { Card, CardBody } from "@heroui/card";
import {
  FaGoogle,
  FaFacebook,
  FaInstagram,
  FaYoutube,
  FaTiktok,
  FaAmazon,
} from "react-icons/fa";
import { SiNaver, SiKakao } from "react-icons/si";

import { PageHeader } from "@/components/common/PageHeader";
import { useDictionary } from "@/hooks/use-dictionary";

const PLATFORMS = [
  { icon: "FaGoogle", name: "Google Ads", color: "text-blue-500" },
  { icon: "FaFacebook", name: "Facebook Ads", color: "text-blue-600" },
  { icon: "FaInstagram", name: "Instagram Ads", color: "text-pink-500" },
  { icon: "FaYoutube", name: "YouTube Ads", color: "text-red-500" },
  { icon: "SiNaver", name: "Naver Ads", color: "text-green-500" },
  { icon: "SiKakao", name: "Kakao Ads", color: "text-yellow-500" },
  {
    icon: "FaTiktok",
    name: "TikTok Ads",
    color: "text-black dark:text-white",
  },
  { icon: "FaAmazon", name: "Amazon Ads", color: "text-orange-500" },
] as const;

const iconMap = {
  FaGoogle,
  FaFacebook,
  FaInstagram,
  FaYoutube,
  SiNaver,
  SiKakao,
  FaTiktok,
  FaAmazon,
} as const;

export function PlatformsSection() {
  const { dictionary: dict } = useDictionary();

  return (
    <section className="px-6 py-20 bg-default-50">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          centered
          pageSubtitle={dict.home.platforms.subtitle}
          pageTitle={dict.home.platforms.title}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
          {PLATFORMS.map((platform, index) => {
            const Icon = iconMap[platform.icon];

            return (
              <Card
                key={index}
                isPressable
                className="hover:shadow-md transition-shadow"
              >
                <CardBody className="flex flex-col items-center p-6">
                  <div className={`text-5xl mb-3 ${platform.color}`}>
                    <Icon />
                  </div>
                  <span className="text-sm font-medium">{platform.name}</span>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
