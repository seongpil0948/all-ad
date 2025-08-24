import { ErrorState } from "@/components/common/ErrorState";
import { getDictionary, type Locale } from "@/app/[lang]/dictionaries";

// This is a server component page that maps incoming error message codes
// (e.g. /en/error?message=no_team) to localized, user-visible text.
// Add additional mappings here as new error codes are introduced.
export default async function ErrorPage({
  searchParams,
  params,
}: {
  // Project currently types these as Promise (see login page). Keep consistent to satisfy generated PageProps.
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  let code: string | string[] | undefined;
  if (searchParams) {
    const resolved = await searchParams;
    code = resolved?.message;
  }

  // Map known error codes to title/message.
  // Reuse existing dictionary entries to avoid duplication.
  const mapped = (() => {
    const normalized = Array.isArray(code) ? code[0] : code;
    switch (normalized) {
      case "no_team":
        return {
          title: dict.errors.general,
          message: dict.integrations.errors.teamNotFound,
        };
      default:
        return {
          title: dict.errors.somethingWentWrong || dict.errors.general,
          message: undefined,
        };
    }
  })();

  return <ErrorState title={mapped.title} message={mapped.message} />;
}
