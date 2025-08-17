import { Metadata } from "next";

import PrivacyPolicyContent from "./PrivacyPolicyContent";
import { Container } from "@/components/layouts/Container";
const CONTAINER_MAX_4XL = "4xl" as const;

export const metadata: Metadata = {
  title: "개인정보 처리방침 | Sivera",
  description:
    "Sivera 서비스의 개인정보 처리방침을 확인하세요. 이용자의 개인정보 보호와 권익 보호에 최선을 다합니다.",
  keywords: ["개인정보", "처리방침", "프라이버시", "시베라", "Sivera"],
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-linear-to-b from-default-50 to-default-100">
      <Container className="py-12" max={CONTAINER_MAX_4XL}>
        <PrivacyPolicyContent />
      </Container>
    </main>
  );
}
