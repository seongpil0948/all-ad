import { Card, CardBody, CardHeader, CardFooter } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { FaCheck, FaStar } from "react-icons/fa";

import PricingButton from "./PricingButton";

import { title, subtitle } from "@/components/primitives";
import { Container } from "@/components/layouts/Container";
import { getDictionary, type Locale } from "@/app/[lang]/dictionaries";

export default async function PricingPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);
  const plans = [
    {
      name: "Starter",
      price: "₩99,000",
      period: "월",
      description: "소규모 비즈니스를 위한 플랜",
      features: [
        "최대 3개 광고 플랫폼 연동",
        "기본 리포트",
        "이메일 지원",
        "월 10,000 API 호출",
        "기본 대시보드",
      ],
      cta: "시작하기",
      popular: false,
    },
    {
      name: "Professional",
      price: "₩299,000",
      period: "월",
      description: "성장하는 비즈니스를 위한 플랜",
      features: [
        "최대 10개 광고 플랫폼 연동",
        "고급 리포트 및 분석",
        "우선 지원",
        "월 100,000 API 호출",
        "맞춤형 대시보드",
        "자동화 기능",
        "팀 협업 기능",
      ],
      cta: "인기 플랜",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "문의",
      period: "",
      description: "대기업을 위한 맞춤형 솔루션",
      features: [
        "무제한 광고 플랫폼 연동",
        "맞춤형 리포트",
        "전담 계정 매니저",
        "무제한 API 호출",
        "화이트 라벨 옵션",
        "고급 보안 기능",
        "맞춤형 통합",
        "SLA 보장",
      ],
      cta: "문의하기",
      popular: false,
    },
  ];

  return (
    <Container className="py-20">
      <div className="text-center mb-12">
        <h1 className={title({ size: "lg" })}>
          {dict.pricing.header.title.pre}{" "}
          <span className={title({ color: "violet", size: "lg" })}>
            {dict.pricing.header.title.highlight}
          </span>
          {dict.pricing.header.title.post}
        </h1>
        <p className={subtitle({ class: "mt-4 max-w-2xl mx-auto" })}>
          {dict.pricing.header.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan, index) => (
          <div key={index}>
            <Card
              className={`h-full ${plan.popular ? "border-primary border-2" : ""}`}
              shadow={plan.popular ? "lg" : "sm"}
            >
              {plan.popular && (
                <Chip
                  className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10"
                  color="primary"
                  startContent={<FaStar />}
                  variant="shadow"
                >
                  {dict.pricing.badges.mostPopular}
                </Chip>
              )}

              <CardHeader className="flex flex-col gap-1 pt-8 pb-0">
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className="text-default-500 text-sm">{plan.description}</p>
              </CardHeader>

              <CardBody className="py-8">
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-default-500 ml-1">
                      /{plan.period}
                    </span>
                  )}
                </div>

                <Divider className="mb-6" />

                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <FaCheck className="text-success mt-1 shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardBody>

              <CardFooter>
                <PricingButton
                  cta={plan.cta}
                  isPopular={plan.popular}
                  planName={plan.name}
                />
              </CardFooter>
            </Card>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <p className="text-default-500">{dict.pricing.footer.note}</p>
      </div>
    </Container>
  );
}
