import { Metadata } from "next";

import CookiePolicyContent from "./CookiePolicyContent";
import { Container } from "@/components/layouts/Container";

const CONTAINER_MAX_4XL = "4xl" as const;

export const metadata: Metadata = {
  title: "쿠키 정책 | ALL AD",
  description:
    "ALL AD 서비스의 쿠키 사용 정책을 확인하세요. 쿠키의 종류, 사용 목적, 관리 방법에 대해 안내합니다.",
  keywords: ["쿠키 정책", "Cookie Policy", "개인정보", "올애드", "All-AD"],
};

export default function CookiePolicyPage() {
  return (
    <main className="min-h-screen bg-linear-to-b from-default-50 to-default-100">
      <Container className="py-12" max={CONTAINER_MAX_4XL}>
        <CookiePolicyContent />
      </Container>
    </main>
  );
}
