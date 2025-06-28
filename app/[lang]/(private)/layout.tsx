import { redirect } from "next/navigation";
import { Suspense } from "react";

import { createClient } from "@/utils/supabase/server";
import { ToastHandler } from "@/components/toast/ToastHandler";
import { SWRProvider } from "@/app/swr-provider";

interface PrivateLayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

export default async function PrivateLayout({
  children,
  params,
}: PrivateLayoutProps) {
  const { lang } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${lang}/login`);
  }

  return (
    <SWRProvider>
      <Suspense fallback={null}>
        <ToastHandler />
      </Suspense>
      {children}
    </SWRProvider>
  );
}
