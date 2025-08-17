import { redirect } from "next/navigation";
import { Suspense } from "react";

import { createClient } from "@/utils/supabase/server";
import { ToastHandler } from "@/components/toast/ToastHandler";

// Private area should always be dynamic and never use the Data/Full Route cache
export const dynamic = "force-dynamic";
export const fetchCache = "default-no-store";
export const experimental_ppr = false;

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
    <>
      <Suspense fallback={null}>
        <ToastHandler />
      </Suspense>
      {children}
    </>
  );
}
