import { Card, CardBody, CardHeader } from "@heroui/card";

import { title } from "@/components/primitives";
import { AuthForm } from "@/components/auth/AuthForm";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{
    returnUrl?: string;
    email?: string;
    inviteToken?: string;
  }>;
}) {
  const params = await searchParams;
  const returnUrl = params.returnUrl;
  const email = params.email;
  const inviteToken = params.inviteToken;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col gap-1 px-6 pt-6">
          <h1 className={title({ size: "sm" })}>회원가입</h1>
          <p className="text-sm text-default-500">
            A.ll + Ad 계정을 생성하세요
          </p>
        </CardHeader>
        <CardBody className="px-6 py-4">
          <AuthForm
            defaultEmail={email}
            initialMode="signup"
            inviteToken={inviteToken}
            returnUrl={returnUrl}
          />
        </CardBody>
      </Card>
    </div>
  );
}
