import { Suspense } from "react";
import { Card, CardBody } from "@heroui/card";

import { ResetPasswordForm } from "./ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardBody className="space-y-6 p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">새 비밀번호 설정</h1>
            <p className="text-default-500 mt-2">
              안전한 새 비밀번호를 입력해주세요
            </p>
          </div>

          <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </CardBody>
      </Card>
    </div>
  );
}
