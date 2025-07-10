import { Suspense } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";

import { ForgotPasswordForm } from "./ForgotPasswordForm";

import { title } from "@/components/primitives";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col gap-1 px-6 pt-6">
          <h1 className={title({ size: "sm" })}>비밀번호 재설정</h1>
          <p className="text-sm text-default-500">
            가입한 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다.
          </p>
        </CardHeader>
        <CardBody className="px-6 py-4">
          <Suspense fallback={<div>Loading...</div>}>
            <ForgotPasswordForm />
          </Suspense>
        </CardBody>
      </Card>
    </div>
  );
}
