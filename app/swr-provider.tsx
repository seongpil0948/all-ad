"use client";

import { SWRConfig } from "swr";
import { addToast } from "@heroui/toast";

import { useDictionary } from "@/hooks/use-dictionary";

const fetcher = async (url: string) => {
  const response = await fetch(url);

  if (!response.ok) {
    const error = new Error("Failed to fetch data") as Error & {
      info?: unknown;
      status?: number;
    };

    try {
      error.info = await response.json();
    } catch {
      error.info = null;
    }
    error.status = response.status;
    throw error;
  }

  return response.json();
};

export const SWRProvider = ({ children }: { children: React.ReactNode }) => {
  const { dictionary: dict } = useDictionary();

  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        refreshInterval: 60000,
        dedupingInterval: 2000,
        onError: (error) => {
          addToast({
            title: dict?.common?.error || "Error",
            description:
              error.message ||
              dict?.errors?.network ||
              "Network error occurred",
            color: "danger",
          });
        },
      }}
    >
      {children}
    </SWRConfig>
  );
};
