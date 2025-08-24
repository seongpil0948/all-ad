/* eslint-disable local/no-literal-strings */
"use client";

import React from "react";
import { Accordion, AccordionItem } from "@heroui/accordion";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  items: FAQItem[];
}

const faqData: FAQCategory[] = [
  {
    title: "서비스 일반",
    items: [
      {
        id: "1",
        question: "Q1: 시베라(Sivera)는 어떤 서비스인가요?",
        answer:
          "A1: 시베라는 여러 광고 플랫폼(구글 애즈(유튜브, 구글), 메타 애즈(페이스북, 인스타그램), 네이버, 쿠팡 등)에 흩어져 있는 광고 계정들의 성과를 하나의 대시보드에서 통합적으로 관리하고 분석할 수 있도록 도와주는 서비스입니다. 광고 운영의 효율성을 높이고 데이터 기반의 빠른 의사결정을 지원합니다.",
      },
      {
        id: "2",
        question:
          "Q2: 올애드를 사용하면 어떤 점이 좋은가요? / 주요 이점은 무엇인가요?",
        answer:
          "A2: 여러 광고 플랫폼에 각각 접속하여 데이터를 확인하고 취합하는 번거로움을 크게 줄일 수 있습니다. 모든 광고 성과를 한눈에 비교 분석하여 시간을 절약하고, 통합된 인사이트를 통해 광고 효율을 개선하며, 더 나아가 광고 운영의 자동화(향후 제공 예정)까지 경험하실 수 있습니다.",
      },
      {
        id: "3",
        question: "Q3: 어떤 사용자를 위한 서비스인가요?",
        answer:
          "A3: 시베라는 1인 기업 대표님부터 중견기업 마케터, 광고 대행사 담당자까지 두 개 이상의 광고 플랫폼을 운영하는 모든 분들을 위한 서비스입니다. 특히 여러 업무를 동시에 처리하며 마케팅 툴 사용에 어려움을 느끼셨던 분들도 쉽게 사용하실 수 있도록 직관적으로 설계되었습니다.",
      },
      {
        id: "4",
        question: "Q4: 모바일에서도 사용할 수 있나요?",
        answer:
          "A4: 네, 시베라는 반응형 웹으로 설계되어 모바일 기기에서도 주요 기능을 편리하게 이용하실 수 있도록 최적화되어 있습니다. 언제 어디서든 광고 성과를 확인하세요.",
      },
    ],
  },
  {
    title: "계정 연동",
    items: [
      {
        id: "5",
        question: "Q5: 어떤 광고 플랫폼을 연동할 수 있나요?",
        answer:
          "A5: 현재 구글 애즈(유튜브, 구글), 메타 애즈(페이스북, 인스타그램), 쿠팡 애즈를 중심으로 지원하고 있으며, 네이버 광고, 카카오 모먼트, 틱톡 애즈, 아마존 애즈, 쇼피파이 등 주요 플랫폼들을 순차적으로 추가 지원할 예정입니다. 최신 지원 플랫폼 목록은 서비스 내 '광고 계정 연동 관리' 페이지 또는 홈페이지에서 확인하실 수 있습니다.",
      },
      {
        id: "6",
        question: "Q6: 광고 계정 연동은 어떻게 하나요? 안전한가요?",
        answer:
          "A6: 각 광고 플랫폼의 공식 API를 통해 안전하게 연동됩니다. 대부분 OAuth 2.0 인증 방식을 사용하며, 사용자의 로그인 정보는 시베라에 저장되지 않습니다. 서비스 내 '광고 계정 연동/관리' 페이지에서 안내에 따라 몇 번의 클릭만으로 간편하게 연동할 수 있습니다. API 키 발급이나 권한 부여 방법에 대한 상세 가이드도 제공됩니다.",
      },
      {
        id: "7",
        question: "Q7: 하나의 플랫폼에 여러 개의 광고 계정을 연동할 수 있나요?",
        answer:
          "A7: 네, 지원합니다. 예를 들어 여러 개의 구글 애즈(유튜브, 구글) 계정을 운영 중이시라면, 각 계정을 모두 시베라에 연동하여 통합적으로 관리하실 수 있습니다. (요금제별 연동 가능한 총 계정 수에는 제한이 있을 수 있습니다.)",
      },
      {
        id: "8",
        question: "Q8: 연동된 계정의 데이터는 얼마나 자주 업데이트되나요?",
        answer:
          "A8: 기본적으로 시간당 1회 데이터 업데이트를 제공하며, 향후 요금제에 따라 더 빠른 업데이트 주기를 지원할 예정입니다.",
      },
      {
        id: "9",
        question: "Q9: 계정 연동 시 오류가 발생하면 어떻게 해야 하나요?",
        answer:
          "A9: '광고 계정 연동/관리' 페이지에서 해당 계정의 오류 상태를 확인하고, 안내되는 오류 메시지 및 해결 가이드를 참고해 주세요. 대부분 API 접근 권한 만료 또는 변경 등의 문제이며, 재인증 절차를 통해 해결될 수 있습니다. 해결이 어려운 경우 고객 지원팀(sivera@sivera.app)에 문의해주시면 신속하게 도와드리겠습니다.",
      },
    ],
  },
  {
    title: "기능 관련",
    items: [
      {
        id: "10",
        question: "Q10: 통합 대시보드에서는 어떤 정보를 볼 수 있나요?",
        answer:
          "A10: 연동된 모든 광고 플랫폼의 핵심 성과 지표(KPI)를 실시간으로 요약하여 보여줍니다. 총 광고비, 총 노출수, 총 클릭수, 평균 CTR, 평균 CPC 등을 한눈에 확인할 수 있으며, 기간별/플랫폼별 필터링 및 주요 지표 추이 그래프도 제공됩니다.",
      },
      {
        id: "11",
        question: "Q11: 캠페인 ON/OFF 기능은 어떻게 사용하나요?",
        answer:
          "A11: '통합 캠페인 목록 및 관리' 페이지에서 각 캠페인 옆에 있는 ON/OFF 토글 스위치를 클릭하고 확인 절차를 거치면 해당 캠페인의 상태를 간편하게 변경할 수 있습니다.",
      },
      {
        id: "12",
        question: "Q12: 리포트를 엑셀 파일로 다운로드 받을 수 있나요?",
        answer:
          "A12: 네, 통합 대시보드나 기본 리포트 페이지에서 조회 중인 데이터를 엑셀(CSV) 또는 PDF 파일로 손쉽게 다운로드하여 내부 보고 자료 등으로 활용하실 수 있습니다.",
      },
      {
        id: "13",
        question:
          "Q13: 팀원들과 함께 사용할 수 있나요? 사용자 역할은 어떻게 되나요?",
        answer:
          "A13: 네, 팀원들과 함께 사용할 수 있습니다. 시베라는 다음과 같은 사용자 역할을 제공합니다.\n\nMaster: 계정의 모든 설정과 기능 사용, 팀원 초대 및 관리 권한.\nTeam Mate: 캠페인 편집(향후 ON/OFF 외 기능 추가 시) 및 사용자 초대 권한.\nViewer: 데이터 조회만 가능한 읽기 전용 권한. 요금제에 따라 초대 가능한 팀원 수가 다를 수 있습니다.",
      },
    ],
  },
  {
    title: "요금제 및 결제",
    items: [
      {
        id: "14",
        question: "Q14: 시베라 요금제는 어떻게 구성되어 있나요?",
        answer:
          "A14: 현재 구글 애즈(유튜브, 구글), 메타 애즈(페이스북, 인스타그램) 연동을 중심으로 주요 기능을 무료로 제공하고 있습니다. (계정당 최대 5명, 시간당 1회 API 호출). 향후 네이버, 쿠팡 등 더 많은 플랫폼 연동과 고급 기능(AI 분석, 자동화 등)이 포함된 다양한 유료 플랜(Free, Starter, Plus, Pro 등)이 제공될 예정입니다. 자세한 내용은 홈페이지 '요금제 안내'를 참고해주세요.",
      },
      {
        id: "15",
        question: "Q15: 무료 체험 기간이 있나요?",
        answer:
          "A15: 현재 주요 기능을 무료로 제공하고 있으며, 향후 유료 플랜 도입 시 별도의 무료 체험 기간을 제공할 수 있습니다.",
      },
      {
        id: "16",
        question: "Q16: 결제 수단은 어떤 것이 있나요? (유료 플랜 출시 후)",
        answer:
          "A16: 국내외 주요 신용카드 및 간편 결제 수단을 지원할 예정입니다.",
      },
      {
        id: "17",
        question:
          "Q17: 요금제를 변경하거나 구독을 해지하고 싶으면 어떻게 하나요? (유료 플랜 출시 후)",
        answer:
          "A17: 서비스 내 '설정 > 요금제 및 결제 관리' 페이지에서 간편하게 요금제를 변경하거나 구독을 해지할 수 있도록 기능을 제공할 예정입니다.",
      },
    ],
  },
  {
    title: "보안 및 데이터",
    items: [
      {
        id: "18",
        question: "Q18: 제 광고 계정 정보와 데이터는 안전하게 관리되나요?",
        answer:
          "A18: 네, 시베라는 사용자의 광고 계정 정보와 데이터를 매우 중요하게 생각하며, 강력한 보안 기술과 정책을 통해 안전하게 관리합니다. API 연동은 각 플랫폼의 공식 인증 절차를 따르며, 민감한 정보는 암호화하여 저장합니다.",
      },
      {
        id: "19",
        question: "Q19: 시베라는 제 광고 데이터를 어떻게 사용하나요?",
        answer:
          "A19: 사용자가 연동한 광고 데이터는 오직 해당 사용자에게 통합된 대시보드와 리포트를 제공하고, 광고 성과 분석 및 서비스 기능(AI 분석, 자동화 등)을 제공하는 목적으로만 사용됩니다. 사용자의 명시적인 동의 없이는 제3자에게 데이터를 제공하거나 다른 목적으로 사용하지 않습니다. 자세한 내용은 '개인정보처리방침'을 참고해주십시오.",
      },
    ],
  },
  {
    title: "기술 지원",
    items: [
      {
        id: "20",
        question: "Q20: 서비스 이용 중 문제가 발생하면 어디에 문의해야 하나요?",
        answer:
          "A20: 서비스 내 '고객 지원' 페이지의 문의하기 양식을 이용하시거나, sivera@sivera.app 으로 문의해주시면 최대한 빠르게 답변드리겠습니다.",
      },
      {
        id: "21",
        question: "Q21: API 키 발급 방법 등 기술적인 가이드가 제공되나요?",
        answer:
          "A21: 네, '광고 계정 연동 관리' 섹션 내에 각 광고 플랫폼별 API 키 발급 방법이나 올애드 서비스 연동을 위한 권한 설정 방법을 상세히 안내하는 가이드 페이지를 제공합니다.",
      },
    ],
  },
];

export default function FAQContent() {
  return (
    <div className="w-full">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">자주 묻는 질문</h1>
        <p className="text-large text-default-600">
          Sivera 서비스 이용에 대한 자주 묻는 질문과 답변을 확인하세요
        </p>
      </div>

      <div className="space-y-8">
        {faqData.map((category) => (
          <div key={category.title} className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary">
              {category.title}
            </h2>
            <Accordion
              className="w-full"
              itemClasses={{
                base: "py-2",
                title: "text-medium",
                content: "text-default-600 pt-2",
              }}
              selectionMode="multiple"
              variant="shadow"
            >
              {category.items.map((item) => (
                <AccordionItem
                  key={item.id}
                  aria-label={item.question}
                  title={
                    <span className="font-medium" data-testid="faq-question">
                      {item.question}
                    </span>
                  }
                >
                  <div className="px-2 pb-2 whitespace-pre-wrap">
                    {item.answer.includes("sivera@sivera.app") ? (
                      <span>
                        {item.answer.split("sivera@sivera.app")[0]}
                        <a
                          className="text-primary hover:underline"
                          href="mailto:sivera@sivera.app"
                        >
                          sivera@sivera.app
                        </a>
                        {item.answer.split("sivera@sivera.app")[1]}
                      </span>
                    ) : (
                      item.answer
                    )}
                  </div>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </div>
    </div>
  );
}
