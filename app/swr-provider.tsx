"use client";

import { SWRConfig } from "swr";
import { addToast } from "@heroui/toast";

const fetcher = async (url: string) => {
  const response = await fetch(url);

  if (!response.ok) {
    const error = new Error("Failed to fetch data") as Error & {
      info?: any;
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
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        refreshInterval: 60000, // 1분마다 자동 갱신
        dedupingInterval: 2000,
        onError: (error) => {
          addToast({
            title: "오류",
            description:
              error.message || "데이터를 가져오는 중 오류가 발생했습니다",
            color: "danger",
          });
        },
      }}
    >
      {children}
    </SWRConfig>
  );
};
