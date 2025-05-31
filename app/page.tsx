"use client";

import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { motion } from "framer-motion";
import {
  FaChartLine,
  FaRocket,
  FaShieldAlt,
  FaDatabase,
  FaGoogle,
  FaFacebook,
  FaInstagram,
  FaYoutube,
  FaTiktok,
  FaAmazon,
} from "react-icons/fa";
import { SiNaver, SiKakao } from "react-icons/si";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { title, subtitle } from "@/components/primitives";
import log from "@/utils/logger";

export default function Home() {
  const router = useRouter();

  // Log page load
  useEffect(() => {
    log.info("Home page loaded", {
      module: "HomePage",
      timestamp: new Date().toISOString(),
    });
  }, []);

  const handleNavigation = (path: string, action: string) => {
    log.info("Navigation initiated", {
      module: "HomePage",
      action,
      targetPath: path,
      fromPath: "/",
    });
    router.push(path);
  };

  const features = [
    {
      icon: <FaChartLine className="w-8 h-8" />,
      title: "통합 대시보드",
      description:
        "모든 광고 플랫폼의 성과를 한눈에 확인하세요. 실시간 데이터 분석과 리포트를 제공합니다.",
    },
    {
      icon: <FaRocket className="w-8 h-8" />,
      title: "자동화된 광고 최적화",
      description:
        "AI 기반 광고 최적화로 ROI를 극대화하고 광고 예산을 효율적으로 관리하세요.",
    },
    {
      icon: <FaShieldAlt className="w-8 h-8" />,
      title: "안전한 데이터 관리",
      description: "엔터프라이즈급 보안으로 광고 데이터를 안전하게 보호합니다.",
    },
    {
      icon: <FaDatabase className="w-8 h-8" />,
      title: "유연한 연동 방식",
      description: "SDK, Open API, DB to DB 등 다양한 연동 방식을 지원합니다.",
    },
  ];

  const platforms = [
    { icon: <FaGoogle />, name: "Google Ads", color: "text-blue-500" },
    { icon: <FaFacebook />, name: "Facebook Ads", color: "text-blue-600" },
    { icon: <FaInstagram />, name: "Instagram Ads", color: "text-pink-500" },
    { icon: <FaYoutube />, name: "YouTube Ads", color: "text-red-500" },
    { icon: <SiNaver />, name: "Naver Ads", color: "text-green-500" },
    { icon: <SiKakao />, name: "Kakao Ads", color: "text-yellow-500" },
    {
      icon: <FaTiktok />,
      name: "TikTok Ads",
      color: "text-black dark:text-white",
    },
    { icon: <FaAmazon />, name: "Amazon Ads", color: "text-orange-500" },
  ];

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-20 lg:py-32">
        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className={title({ size: "lg" })}>
              모든 광고를{" "}
              <span className={title({ color: "violet", size: "lg" })}>
                하나로
              </span>
            </h1>
            <p className={subtitle({ class: "mt-4 max-w-2xl mx-auto" })}>
              여러 광고 플랫폼을 하나의 대시보드에서 관리하세요. 실시간 분석과
              자동 최적화로 광고 성과를 극대화합니다.
            </p>
          </motion.div>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4 justify-center mt-8"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button
              color="primary"
              size="lg"
              variant="shadow"
              onPress={() => handleNavigation("/login", "start-free")}
            >
              무료로 시작하기
            </Button>
            <Button
              size="lg"
              variant="bordered"
              onPress={() => handleNavigation("/demo", "view-demo")}
            >
              데모 보기
            </Button>
          </motion.div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-100 to-pink-100 dark:from-violet-900/20 dark:to-pink-900/20 opacity-50" />
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1 }}
          >
            <h2 className={title({ size: "md" })}>주요 기능</h2>
            <p className={subtitle({ class: "mt-2" })}>
              광고 관리를 더 스마트하게
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-0 pt-6">
                    <div className="p-3 bg-primary/10 rounded-lg w-fit">
                      {feature.icon}
                    </div>
                  </CardHeader>
                  <CardBody>
                    <h3 className="text-lg font-semibold mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-default-500">{feature.description}</p>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Platforms */}
      <section className="px-6 py-20 bg-default-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1 }}
          >
            <h2 className={title({ size: "md" })}>연동 가능한 플랫폼</h2>
            <p className={subtitle({ class: "mt-2" })}>
              국내외 주요 광고 플랫폼을 모두 지원합니다
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {platforms.map((platform, index) => (
              <motion.div
                key={index}
                className="flex flex-col items-center p-6 bg-white dark:bg-default-100 rounded-lg hover:shadow-md transition-shadow"
                initial={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                viewport={{ once: true }}
                whileInView={{ opacity: 1, scale: 1 }}
              >
                <div className={`text-5xl mb-3 ${platform.color}`}>
                  {platform.icon}
                </div>
                <span className="text-sm font-medium">{platform.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1 }}
          >
            <h2 className={title({ size: "md" })}>직관적인 대시보드</h2>
            <p className={subtitle({ class: "mt-2" })}>
              복잡한 데이터를 쉽게 이해할 수 있도록 시각화합니다
            </p>
          </motion.div>

          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <Card className="overflow-hidden">
              <CardBody className="p-0">
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                  <p className="text-xl text-default-500">대시보드 미리보기</p>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 bg-gradient-to-r from-primary to-secondary">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              지금 시작하세요
            </h2>
            <p className="text-xl text-white/90 mb-8">
              14일 무료 체험으로 모든 기능을 경험해보세요
            </p>
            <Button
              className="bg-white text-primary font-semibold"
              size="lg"
              variant="solid"
              onPress={() => handleNavigation("/login", "start-trial")}
            >
              무료 체험 시작하기
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
