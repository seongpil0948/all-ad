import { useState, useEffect, useCallback } from "react";

import log from "@/utils/logger";

interface UseDataFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDataFetch<T>(
  fetchFn: () => Promise<T>,
): UseDataFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();

      setData(result);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "데이터를 불러오는데 실패했습니다";

      setError(errorMessage);
      log.error("Data fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

// Variant for paginated data
interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

interface UsePaginatedDataFetchResult<T>
  extends UseDataFetchResult<PaginatedData<T>> {
  nextPage: () => void;
  prevPage: () => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
}

export function usePaginatedDataFetch<T>(
  fetchFn: (page: number, pageSize: number) => Promise<PaginatedData<T>>,
  initialPageSize: number = 10,
): UsePaginatedDataFetchResult<T> {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const paginatedFetchFn = useCallback(
    () => fetchFn(page, pageSize),
    [fetchFn, page, pageSize],
  );

  const result = useDataFetch(paginatedFetchFn);

  const nextPage = useCallback(() => {
    if (result.data && page < Math.ceil(result.data.total / pageSize)) {
      setPage(page + 1);
    }
  }, [page, pageSize, result.data]);

  const prevPage = useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  }, [page]);

  return {
    ...result,
    nextPage,
    prevPage,
    setPage,
    setPageSize: (newPageSize: number) => {
      setPageSize(newPageSize);
      setPage(1); // Reset to first page when page size changes
    },
  };
}
