"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { toast } from "@/utils/toast";

export function ToastHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const toastType = searchParams.get("toast");
    const toastMessage = searchParams.get("message");
    const toastDescription = searchParams.get("description");

    if (toastType && toastMessage) {
      switch (toastType) {
        case "success":
          toast.success({
            title: toastMessage,
            description: toastDescription || undefined,
          });
          break;
        case "error":
          toast.error({
            title: toastMessage,
            description: toastDescription || undefined,
          });
          break;
        case "warning":
          toast.warning({
            title: toastMessage,
            description: toastDescription || undefined,
          });
          break;
        case "info":
          toast.info({
            title: toastMessage,
            description: toastDescription || undefined,
          });
          break;
      }

      // Remove toast params from URL
      const newSearchParams = new URLSearchParams(searchParams);

      newSearchParams.delete("toast");
      newSearchParams.delete("message");
      newSearchParams.delete("description");

      const newUrl =
        window.location.pathname +
        (newSearchParams.toString() ? `?${newSearchParams.toString()}` : "");

      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams]);

  return null;
}
