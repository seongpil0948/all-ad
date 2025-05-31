"use client";

import { Card, CardBody } from "@heroui/card";
import { motion } from "framer-motion";
import { FaPlug, FaCog, FaChartBar, FaRocket } from "react-icons/fa";
import { Badge } from "@heroui/badge";

import { title, subtitle } from "@/components/primitives";

interface ProcessStepProps {
  icon: React.ReactNode;
  stepNumber: string;
  title: string;
  description: string;
}

const ProcessStep = ({
  icon,
  stepNumber,
  title,
  description,
}: ProcessStepProps) => {
  return (
    <Badge
      color="primary"
      content={stepNumber}
      placement="top-left"
      size="lg"
      variant="faded"
    >
      <Card className="h-full">
        <CardBody className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-primary/10 rounded-full text-primary">
            {icon}
          </div>
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-default-500">{description}</p>
        </CardBody>
      </Card>
    </Badge>
  );
};

export const IntegrationProcessSection = () => {
  const steps = [
    {
      icon: <FaPlug className="w-8 h-8" />,
      stepNumber: "1",
      title: "광고 플랫폼 연동",
      description:
        "Google, Facebook, Naver 등 사용 중인 광고 플랫폼을 간편하게 연동하세요.",
    },
    {
      icon: <FaCog className="w-8 h-8" />,
      stepNumber: "2",
      title: "자동화 규칙 설정",
      description:
        "예산, 타겟팅, 입찰가 등의 자동화 규칙을 설정하여 광고를 최적화하세요.",
    },
    {
      icon: <FaChartBar className="w-8 h-8" />,
      stepNumber: "3",
      title: "통합 분석 대시보드",
      description:
        "모든 플랫폼의 성과를 실시간으로 모니터링하고 인사이트를 얻으세요.",
    },
    {
      icon: <FaRocket className="w-8 h-8" />,
      stepNumber: "4",
      title: "성과 극대화",
      description:
        "AI 기반 추천과 A/B 테스트로 광고 성과를 지속적으로 개선하세요.",
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
          <h2 className={title({ size: "md" })}>간단한 시작, 강력한 성과</h2>
          <p className={subtitle({ class: "mt-2" })}>
            4단계로 광고 관리를 혁신하세요
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <ProcessStep {...step} />
            </motion.div>
          ))}
        </div>

        {/* Connection lines for desktop */}
        <div className="hidden lg:block relative -mt-32 mb-16">
          <svg
            className="absolute top-1/2 left-0 w-full h-2 -translate-y-1/2"
            preserveAspectRatio="none"
          >
            <line
              className="text-primary/30"
              stroke="currentColor"
              strokeDasharray="5,5"
              strokeWidth="2"
              x1="12.5%"
              x2="87.5%"
              y1="50%"
              y2="50%"
            />
          </svg>
        </div>
      </div>
    </section>
  );
};
