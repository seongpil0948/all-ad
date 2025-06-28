import { Metadata } from "next";

import PrivacyPolicyContent from "./PrivacyPolicyContent";

export const metadata: Metadata = {
  title: "개인정보 처리방침 | ALL AD",
  description:
    "ALL AD 서비스의 개인정보 처리방침을 확인하세요. 이용자의 개인정보 보호와 권익 보호에 최선을 다합니다.",
  keywords: ["개인정보", "처리방침", "프라이버시", "올애드", "All-AD"],
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-default-50 to-default-100">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <PrivacyPolicyContent />
      </div>
    </main>
  );
}
