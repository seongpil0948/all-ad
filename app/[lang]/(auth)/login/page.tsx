import { AuthForm } from "@/components/features/auth/AuthForm";

export default async function LoginPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{
    mode?: string;
    returnUrl?: string;
    email?: string;
    inviteToken?: string;
  }>;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const { mode, returnUrl, email, inviteToken } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <AuthForm
        initialMode={mode === "signup" ? "signup" : "login"}
        returnUrl={returnUrl}
        defaultEmail={email}
        inviteToken={inviteToken}
      />
    </div>
  );
}
