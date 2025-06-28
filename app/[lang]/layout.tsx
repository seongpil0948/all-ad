import { getDictionary, type Locale } from "./dictionaries";

import { Navbar } from "@/components/layouts/navbar";
import { Footer } from "@/components/layouts/footer";
import { DictionaryProvider } from "@/hooks/use-dictionary";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = lang as Locale;
  const dictionary = await getDictionary(locale);

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.lang = "${lang}"`,
        }}
      />
      <DictionaryProvider dictionary={dictionary} locale={locale}>
        <div className="relative flex flex-col h-screen">
          <Navbar />
          <main className="mx-auto grow w-full">{children}</main>
          <Footer />
        </div>
      </DictionaryProvider>
    </>
  );
}
