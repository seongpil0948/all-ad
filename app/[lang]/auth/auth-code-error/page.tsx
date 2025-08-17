import { AlertTriangle } from "lucide-react";
import { Card } from "@heroui/card";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { getDictionary, type Locale } from "@/app/[lang]/dictionaries";

export default async function AuthCodeErrorPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {dict.auth.codeError.title}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {dict.auth.codeError.description}
          </p>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              {dict.auth.codeError.reasonsTitle}
            </p>

            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>{dict.auth.codeError.reasons.expired}</li>
              <li>{dict.auth.codeError.reasons.used}</li>
              <li>{dict.auth.codeError.reasons.invalid}</li>
            </ul>

            <div className="pt-4 border-t border-gray-200">
              <p className="mb-3 text-sm text-gray-700">
                {dict.auth.codeError.solutionTitle}
              </p>

              <div className="space-y-2">
                <Button
                  fullWidth
                  as={Link}
                  color="primary"
                  href="/forgot-password"
                >
                  {dict.auth.codeError.actions.resetPassword}
                </Button>

                <Button fullWidth as={Link} href="/login" variant="bordered">
                  {dict.auth.codeError.actions.backToLogin}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            {dict.auth.codeError.footerHelp}
          </p>
        </div>
      </div>
    </div>
  );
}
