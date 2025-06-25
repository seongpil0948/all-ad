import { redirect } from "next/navigation";
import { Suspense } from "react";

import { createClient } from "@/utils/supabase/server";
import { ToastHandler } from "@/components/toast/ToastHandler";

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
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
