import { Suspense } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";

import { ForgotPasswordForm } from "./ForgotPasswordForm";

import { title } from "@/components/primitives";
import { getDictionary, type Locale } from "@/app/[lang]/dictionaries";

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col gap-1 px-6 pt-6">
          <h1 className={title({ size: "sm" })}>
            {dict.auth.forgotPassword.title}
          </h1>
          <p className="text-sm text-default-500">
            {dict.auth.forgotPassword.subtitle}
          </p>
        </CardHeader>
        <CardBody className="px-6 py-4">
          <Suspense fallback={<div>{dict.common.loading}</div>}>
            <ForgotPasswordForm />
          </Suspense>
        </CardBody>
      </Card>
    </div>
  );
}
