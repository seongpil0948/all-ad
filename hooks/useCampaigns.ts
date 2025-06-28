import useSWR, { mutate } from "swr";
import useSWRMutation from "swr/mutation";

import { Campaign } from "@/types/campaign.types";
import { PlatformType } from "@/types";

interface CampaignStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalSpend: number;
  totalClicks: number;
  totalImpressions: number;
  averageCTR: number;
  averageCPC: number;
}

interface CampaignsResponse {
  campaigns: Campaign[];
  stats: CampaignStats;
}

// 캠페인 목록 가져오기
export function useCampaigns(platform?: PlatformType | "all") {
  const params = new URLSearchParams();

  if (platform && platform !== "all") {
    params.append("platform", platform);
  }

  const { data, error, isLoading, mutate } = useSWR<CampaignsResponse>(
    `/api/campaigns${params.toString() ? `?${params.toString()}` : ""}`,
    null,
    {
      refreshInterval: 30000, // 30초마다 자동 갱신
      revalidateOnMount: true,
      revalidateOnFocus: true,
    },
  );

  return {
    campaigns: data?.campaigns || [],
    stats: data?.stats,
    isLoading,
    error,
    refetch: mutate,
  };
}

// 캠페인 상태 업데이트
async function updateCampaignStatus(
  url: string,
  { arg }: { arg: { campaignId: string; status: "ENABLED" | "PAUSED" } },
) {
  const [platform, platformCampaignId] = arg.campaignId.split("_");

  const response = await fetch(
    `/api/campaigns/${platform}/${platformCampaignId}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: arg.status }),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to update campaign status");
  }

  return response.json();
}

export function useCampaignMutation() {
  const { trigger: updateStatus, isMutating: isUpdatingStatus } =
    useSWRMutation("/api/campaigns", updateCampaignStatus);

  return {
    updateStatus,
    isUpdatingStatus,
  };
}

// 플랫폼 동기화
async function syncPlatform(
  url: string,
  { arg }: { arg: { platform: PlatformType } },
) {
  const response = await fetch(`/api/sync/${arg.platform}`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Failed to sync ${arg.platform}`);
  }

  return response.json();
}

export function usePlatformSync() {
  const { trigger: sync, isMutating: isSyncing } = useSWRMutation(
    "/api/sync",
    syncPlatform,
    {
      onSuccess: () => {
        // 동기화 성공 시 캠페인 데이터 재검증
        mutate(
          (key) => typeof key === "string" && key.startsWith("/api/campaigns"),
        );
      },
    },
  );

  return {
    sync,
    isSyncing,
  };
}

// 여러 플랫폼 동기화
export function useMultiPlatformSync(platforms: PlatformType[]) {
  const { sync, isSyncing } = usePlatformSync();

  const syncAll = async () => {
    const results = await Promise.allSettled(
      platforms.map((platform) => sync({ platform })),
    );

    const errors = results
      .filter((result) => result.status === "rejected")
      .map((result) => (result as PromiseRejectedResult).reason);

    if (errors.length > 0) {
      throw new Error(`Failed to sync some platforms: ${errors.join(", ")}`);
    }

    return results;
  };

  return {
    syncAll,
    isSyncing,
  };
}

// 캠페인 예산 업데이트
async function updateCampaignBudget(
  url: string,
  { arg }: { arg: { campaignId: string; budget: number } },
) {
  const [platform, platformCampaignId] = arg.campaignId.split("_");

  const response = await fetch(
    `/api/campaigns/${platform}/${platformCampaignId}/budget`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ budget: arg.budget }),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to update campaign budget");
  }

  return response.json();
}

export function useCampaignBudgetMutation() {
  const { trigger: updateBudget, isMutating: isUpdatingBudget } =
    useSWRMutation("/api/campaigns", updateCampaignBudget, {
      onSuccess: () => {
        // 예산 업데이트 성공 시 캠페인 데이터 재검증
        mutate(
          (key) => typeof key === "string" && key.startsWith("/api/campaigns"),
        );
      },
    });

  return {
    updateBudget,
    isUpdatingBudget,
  };
}
