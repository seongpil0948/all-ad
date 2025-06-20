"use client";

import { Card, CardBody, CardHeader, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { motion } from "framer-motion";
import { FaCheck } from "react-icons/fa";
import { useRouter } from "next/navigation";

import { title, subtitle } from "@/components/primitives";

interface PricingPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  buttonText: string;
  buttonVariant?: "solid" | "bordered" | "flat";
}

const PricingCard = ({ plan, index }: { plan: PricingPlan; index: number }) => {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <Card
        className={`h-full ${
          plan.highlighted
            ? "border-primary shadow-xl scale-105 lg:scale-110"
            : ""
        }`}
      >
        <CardHeader className="pb-0 pt-6 px-6 flex-col items-start">
          {plan.highlighted && (
            <Chip className="mb-2" color="primary" size="sm">
              가장 인기 있는 플랜
            </Chip>
          )}
          <h3 className="text-xl font-semibold">{plan.name}</h3>
          <p className="text-default-500 text-sm mt-1">{plan.description}</p>
          <div className="mt-4">
            <span className="text-4xl font-bold">{plan.price}</span>
            <span className="text-default-500 text-sm">/{plan.period}</span>
          </div>
        </CardHeader>
        <CardBody className="px-6 py-4">
          <ul className="space-y-3">
            {plan.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <FaCheck className="text-success mt-0.5 shrink-0" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </CardBody>
        <CardFooter className="px-6 pb-6">
          <Button
            fullWidth
            color={plan.highlighted ? "primary" : "default"}
            variant={plan.buttonVariant || "solid"}
            onPress={() => router.push("/login")}
          >
            {plan.buttonText}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export const PricingSection = () => {
  const plans: PricingPlan[] = [
    {
      name: "Starter",
      price: "₩99,000",
      period: "월",
      description: "소규모 비즈니스를 위한 기본 플랜",
      features: [
        "최대 3개 광고 플랫폼 연동",
        "월 100만원까지 광고비 관리",
        "기본 리포트 및 분석",
        "이메일 지원",
      ],
      buttonText: "시작하기",
      buttonVariant: "bordered",
    },
    {
      name: "Professional",
      price: "₩299,000",
      period: "월",
      description: "성장하는 비즈니스를 위한 전문가 플랜",
      features: [
        "최대 10개 광고 플랫폼 연동",
        "월 1,000만원까지 광고비 관리",
        "고급 분석 및 AI 최적화",
        "자동화 규칙 설정",
        "우선 지원 및 전담 매니저",
      ],
      highlighted: true,
      buttonText: "가장 인기 있는 선택",
    },
    {
      name: "Enterprise",
      price: "맞춤 견적",
      period: "월",
      description: "대규모 기업을 위한 맞춤형 솔루션",
      features: [
        "무제한 광고 플랫폼 연동",
        "무제한 광고비 관리",
        "전체 기능 및 커스터마이징",
        "API 액세스",
        "전담 성공 매니저",
        "온보딩 및 교육 지원",
      ],
      buttonText: "문의하기",
      buttonVariant: "flat",
    },
  ];

  return (
    <section className="px-6 py-20 bg-default-50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1 }}
        >
          <h2 className={title({ size: "md" })}>
            비즈니스에 맞는 플랜을 선택하세요
          </h2>
          <p className={subtitle({ class: "mt-2" })}>
            14일 무료 체험으로 모든 기능을 경험해보세요
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {plans.map((plan, index) => (
            <PricingCard key={index} index={index} plan={plan} />
          ))}
        </div>

        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1 }}
        >
          <p className="text-default-600">
            모든 플랜에는 14일 무료 체험이 포함되어 있습니다. 언제든지 취소할 수
            있습니다.
          </p>
        </motion.div>
      </div>
    </section>
  );
};
