/* eslint-disable local/no-literal-strings */
import { FAQAccordion } from "./FAQAccordion";

import { title, subtitle } from "@/components/primitives";

export const FAQSection = () => {
  const faqs = [
    {
      question: "올애드는 어떤 광고 플랫폼을 지원하나요?",
      answer:
        "Google Ads, Facebook Ads, Instagram Ads, YouTube Ads, Naver Ads, Kakao Ads, TikTok Ads, Amazon Ads 등 국내외 주요 광고 플랫폼을 모두 지원합니다. 지속적으로 새로운 플랫폼을 추가하고 있습니다.",
    },
    {
      question: "기존 광고 캠페인을 그대로 이전할 수 있나요?",
      answer:
        "네, 가능합니다. 올애드는 기존 광고 플랫폼과 API 연동을 통해 현재 운영 중인 캠페인을 그대로 가져올 수 있습니다. 데이터 손실 없이 안전하게 이전됩니다.",
    },
    {
      question: "최소 계약 기간이 있나요?",
      answer:
        "아니요, 최소 계약 기간은 없습니다. 월 단위로 결제하며 언제든지 해지할 수 있습니다. 14일 무료 체험 기간 동안 모든 기능을 사용해보고 결정하실 수 있습니다.",
    },
    {
      question: "데이터 보안은 어떻게 관리되나요?",
      answer:
        "모든 데이터는 암호화되어 전송되고 저장됩니다. ISO 27001 인증을 받은 데이터센터를 사용하며, 정기적인 보안 감사를 실시합니다. 또한 2단계 인증과 역할 기반 접근 제어를 제공합니다.",
    },
    {
      question: "API 연동 외에 다른 연동 방식도 지원하나요?",
      answer:
        "네, SDK, Open API, DB to DB, CSV 업로드 등 다양한 연동 방식을 지원합니다. 각 광고사와 대행사의 상황에 맞는 최적의 연동 방식을 선택할 수 있습니다.",
    },
  ];

  return (
    <section className="px-6 py-20">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className={title({ size: "md" })}>자주 묻는 질문</h2>
          <p className={subtitle({ class: "mt-2" })}>
            궁금하신 점이 있으신가요?
          </p>
        </div>

        <FAQAccordion faqs={faqs} />
      </div>
    </section>
  );
};
