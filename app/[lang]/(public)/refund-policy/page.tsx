import { Metadata } from "next";

import RefundPolicyContent from "./RefundPolicyContent";

export const metadata: Metadata = {
  title: "청약철회 및 환불규정 | ALL AD",
  description:
    "ALL AD 서비스의 청약철회 및 환불 정책을 확인하세요. API 연동 시 환불 불가, 미연동 상태로 7일 이내 환불 가능합니다.",
  keywords: ["환불규정", "청약철회", "API 연동", "올애드", "All-AD"],
};

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-linear-to-b from-default-50 to-default-100">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <RefundPolicyContent />
      </div>
    </main>
  );
}
