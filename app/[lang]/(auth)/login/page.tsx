import { Card, CardBody, CardHeader } from "@heroui/card";

import { getDictionary, type Locale } from "../../dictionaries";

import { title } from "@/components/primitives";
import { AuthForm } from "@/components/features/auth/AuthForm";

export default async function LoginPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{
    returnUrl?: string;
  }>;
  params: Promise<{ lang: string }>;
}) {
  const searchP = await searchParams;
  const returnUrl = searchP.returnUrl;
  const { lang } = await params;
  const locale = lang as Locale;
  const dict = await getDictionary(locale);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col gap-1 px-6 pt-6">
          <h1 className={title({ size: "sm" })}>{dict.auth.login.title}</h1>
          <p className="text-sm text-default-500">
            {dict.footer.companyInfo.name}
          </p>
        </CardHeader>
        <CardBody className="px-6 py-4">
          <AuthForm initialMode="login" returnUrl={returnUrl} />
        </CardBody>
      </Card>
    </div>
  );
}
