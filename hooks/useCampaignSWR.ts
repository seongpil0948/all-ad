import { useMemo, useCallback } from "react";
import useSWR from "swr";
import { useShallow } from "zustand/shallow";

import { Campaign, CampaignStats } from "@/types/campaign.types";
import { PlatformType } from "@/types";
import { useCampaignStore } from "@/stores";

interface CampaignStatsResponse {
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
  stats: CampaignStatsResponse;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

// 독립적인 캠페인 데이터 훅
export function useCampaignSWR(platform?: PlatformType | "all") {
  const { filters, setIsLoading, setError, setCampaigns, setStats } =
    useCampaignStore(
      useShallow((state) => ({
        filters: state.filters,
        setIsLoading: state.setIsLoading,
        setError: state.setError,
        setCampaigns: state.setCampaigns,
        setStats: state.setStats,
      })),
    );

  // URL 파라미터 구성
  const params = new URLSearchParams();

  if (platform && platform !== "all") {
    params.append("platform", platform);
  }

  // SWR로 데이터 가져오기
  const { data, error, isLoading, mutate } = useSWR<
    ApiResponse<CampaignsResponse>
  >(`/api/campaigns${params.toString() ? `?${params.toString()}` : ""}`, null, {
    refreshInterval: 30000, // 30초마다 자동 갱신
    revalidateOnMount: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 5000, // 5초 중복 제거
    errorRetryCount: 3,
    errorRetryInterval: 1000,
    onSuccess: (response) => {
      // successResponse wraps data in { success: true, data: ... }
      const campaignsData = response.data as CampaignsResponse;

      // 성공 시 store 업데이트
      setCampaigns(campaignsData?.campaigns || []);
      // API response를 store의 CampaignStats 타입으로 변환
      const transformedStats: CampaignStats = {
        ...(campaignsData?.stats || {}),
        totalBudget: 0, // API에서 제공하지 않는 경우 기본값
        platforms: 0, // API에서 제공하지 않는 경우 기본값
      };

      setStats(transformedStats);
      setError(null);
      setIsLoading(false);
    },
    onError: (err) => {
      // 에러 시 store 업데이트
      setError(err);
      setIsLoading(false);
    },
    onLoadingSlow: () => {
      // 로딩이 오래 걸릴 때
      setIsLoading(true);
    },
  });

  // 필터링된 캠페인 목록
  const filteredCampaigns = useMemo(() => {
    // Handle wrapped response from successResponse
    const campaigns = data?.data?.campaigns || [];

    if (!campaigns.length) return [];

    let filtered = campaigns;

    // 플랫폼 필터
    if (filters.platform && filters.platform !== "all") {
      filtered = filtered.filter(
        (campaign: Campaign) => campaign.platform === filters.platform,
      );
    }

    // 상태 필터
    if (filters.status && filters.status !== "all") {
      filtered = filtered.filter((campaign: Campaign) => {
        switch (filters.status) {
          case "active":
            return campaign.isActive;
          case "paused":
            return !campaign.isActive;
          default:
            return true;
        }
      });
    }

    // 검색 필터
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();

      filtered = filtered.filter(
        (campaign: Campaign) =>
          campaign.name.toLowerCase().includes(searchLower) ||
          campaign.platformCampaignId?.toLowerCase().includes(searchLower),
      );
    }

    return filtered;
  }, [data, filters]);

  // Handle wrapped response from successResponse
  const responseData = data?.data as CampaignsResponse | undefined;

  return {
    campaigns: responseData?.campaigns || [],
    filteredCampaigns,
    stats: responseData?.stats,
    isLoading,
    error,
    mutate,
    refetch: mutate,
  };
}

// 페이지네이션을 위한 훅
export function useCampaignPagination(
  filteredCampaigns: Campaign[],
  itemsPerPage: number = 20,
) {
  const { pagination, setPagination } = useCampaignStore(
    useShallow((state) => ({
      pagination: state.pagination,
      setPagination: state.setPagination,
    })),
  );

  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);
  const hasMore = pagination.page < totalPages;

  const displayedCampaigns = useMemo(() => {
    const startIndex = 0;
    const endIndex = pagination.page * itemsPerPage;

    return filteredCampaigns.slice(startIndex, endIndex);
  }, [filteredCampaigns, pagination.page, itemsPerPage]);

  const loadMore = useCallback(() => {
    if (hasMore) {
      setPagination({
        page: pagination.page + 1,
        total: filteredCampaigns.length,
      });
    }
  }, [hasMore, setPagination, pagination.page, filteredCampaigns.length]);

  const reset = useCallback(() => {
    setPagination({
      page: 1,
      total: filteredCampaigns.length,
    });
  }, [setPagination, filteredCampaigns.length]);

  return {
    displayedCampaigns,
    hasMore,
    loadMore,
    reset,
    currentPage: pagination.page,
    totalPages,
    totalItems: filteredCampaigns.length,
  };
}
