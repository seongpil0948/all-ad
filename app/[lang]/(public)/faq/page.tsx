import { Metadata } from "next";

import FAQContent from "./FAQContent";
import { Container } from "@/components/layouts/Container";

const CONTAINER_MAX_4XL = "4xl" as const;

export const metadata: Metadata = {
  title: "자주 묻는 질문 | Sivera",
  description:
    "Sivera 서비스 이용에 대한 자주 묻는 질문과 답변을 확인하세요. 서비스 일반, 계정 연동, 기능, 요금제, 보안 등에 대한 정보를 제공합니다.",
  keywords: ["FAQ", "자주 묻는 질문", "시베라", "Sivera", "도움말"],
};

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-linear-to-b from-default-50 to-default-100">
      <Container className="py-12" max={CONTAINER_MAX_4XL}>
        <FAQContent />
      </Container>
    </main>
  );
}
