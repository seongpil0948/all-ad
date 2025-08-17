import { Suspense } from "react";
import { Card, CardBody } from "@heroui/card";

import { ResetPasswordForm } from "./ResetPasswordForm";
import { getDictionary, type Locale } from "@/app/[lang]/dictionaries";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardBody className="space-y-6 p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">
              {dict.auth.resetPassword.title}
            </h1>
            <p className="text-default-500 mt-2">
              {dict.auth.resetPassword.subtitle}
            </p>
          </div>

          <Suspense fallback={<div>{dict.common.loading}</div>}>
            <ResetPasswordForm />
          </Suspense>
        </CardBody>
      </Card>
    </div>
  );
}
