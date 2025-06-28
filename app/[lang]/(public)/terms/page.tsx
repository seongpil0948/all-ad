import { Metadata } from "next";

import TermsOfServiceContent from "./TermsOfServiceContent";

export const metadata: Metadata = {
  title: "이용약관 | ALL AD",
  description:
    "ALL AD 서비스 이용약관을 확인하세요. 서비스 이용과 관련된 회사와 회원 간의 권리, 의무 및 책임사항을 규정합니다.",
  keywords: ["이용약관", "서비스 약관", "올애드", "All-AD"],
};

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-default-50 to-default-100">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <TermsOfServiceContent />
      </div>
    </main>
  );
}
