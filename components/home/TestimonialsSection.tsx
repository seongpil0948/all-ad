/* eslint-disable local/no-literal-strings */
"use client";

import { Avatar } from "@heroui/avatar";
import { Card, CardBody } from "@heroui/card";
import { motion, useReducedMotion } from "framer-motion";
import { FaStar } from "react-icons/fa";

import { title, subtitle } from "@/components/primitives";
import { Container } from "@/components/layouts/Container";
import { AutoGrid } from "@/components/common/AutoGrid";

interface TestimonialProps {
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  avatarUrl?: string;
}

const TestimonialCard = ({
  name,
  role,
  company,
  content,
  rating,
  avatarUrl,
}: TestimonialProps) => {
  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardBody className="flex flex-col gap-4">
        <div className="flex gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <FaStar
              key={i}
              className={`w-4 h-4 ${
                i < rating ? "text-warning" : "text-default-200"
              }`}
            />
          ))}
        </div>
        <p className="text-default-600 flex-1">{content}</p>
        <div className="flex items-center gap-3">
          <Avatar className="shrink-0" name={name} size="sm" src={avatarUrl} />
          <div>
            <p className="font-semibold text-sm">{name}</p>
            <p className="text-xs text-default-500">
              {role} @ {company}
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export const TestimonialsSection = () => {
  const prefersReducedMotion = useReducedMotion();
  const testimonials: TestimonialProps[] = [
    {
      name: "김지영",
      role: "마케팅 매니저",
      company: "테크스타트업",
      content:
        "모든 광고 플랫폼을 한 곳에서 관리할 수 있어 업무 효율이 크게 향상되었습니다. 실시간 데이터 분석 기능이 특히 유용합니다.",
      rating: 5,
    },
    {
      name: "이준호",
      role: "퍼포먼스 마케터",
      company: "이커머스A",
      content:
        "자동 최적화 기능 덕분에 광고 운영에 드는 시간을 절반으로 줄였습니다. ROI가 평균 35% 상승했어요.",
      rating: 5,
    },
    {
      name: "박서연",
      role: "대표이사",
      company: "디지털에이전시",
      content:
        "클라이언트별로 권한을 나누어 관리할 수 있어 협업이 편리합니다. 리포트 자동화로 보고서 작성 시간도 대폭 단축되었습니다.",
      rating: 4,
    },
  ];

  return (
    <section className="py-20">
      <Container>
        <motion.div
          className="text-center mb-12"
          initial={prefersReducedMotion ? undefined : { opacity: 0 }}
          transition={prefersReducedMotion ? undefined : { duration: 0.5 }}
          viewport={{ once: true }}
          whileInView={prefersReducedMotion ? undefined : { opacity: 1 }}
        >
          <h2 className={title({ size: "md" })}>고객이 말하는 올애드</h2>
          <p className={subtitle({ class: "mt-2" })}>
            실제 사용자들의 생생한 후기를 확인하세요
          </p>
        </motion.div>

        <AutoGrid minItemWidth={280}>
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20 }}
              transition={
                prefersReducedMotion
                  ? undefined
                  : { duration: 0.5, delay: index * 0.1 }
              }
              viewport={{ once: true }}
              whileInView={
                prefersReducedMotion ? undefined : { opacity: 1, y: 0 }
              }
            >
              <TestimonialCard {...testimonial} />
            </motion.div>
          ))}
        </AutoGrid>
      </Container>
    </section>
  );
};
