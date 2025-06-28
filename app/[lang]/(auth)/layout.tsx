import { Suspense } from "react";

import { ToastHandler } from "@/components/toast/ToastHandler";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <ToastHandler />
      </Suspense>
      {children}
    </>
  );
}
