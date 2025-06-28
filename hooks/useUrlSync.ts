"use client";

import { useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface UrlSyncConfig<T> {
  store: T;
  paramsMap: {
    [K in keyof T]?: {
      key: string; // URL parameter key
      serialize?: (value: T[K]) => string;
      deserialize?: (value: string) => T[K];
    };
  };
}

/**
 * Hook to synchronize store state with URL parameters
 * @param config Configuration object with store and parameter mappings
 */
export function useUrlSync<T extends Record<string, unknown>>(
  config: UrlSyncConfig<T>,
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Serialize store state to URL
  const syncToUrl = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(config.paramsMap).forEach(([storeKey, paramConfig]) => {
      if (paramConfig) {
        const value = config.store[storeKey];
        const { key, serialize } = paramConfig;

        if (value !== undefined && value !== null && value !== "") {
          const serialized = serialize ? serialize(value) : String(value);

          params.set(key, serialized);
        } else {
          params.delete(key);
        }
      }
    });

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [config, pathname, router, searchParams]);

  // Deserialize URL to store state
  const syncFromUrl = useCallback(() => {
    Object.entries(config.paramsMap).forEach(([storeKey, paramConfig]) => {
      if (paramConfig) {
        const { key, deserialize } = paramConfig;
        const urlValue = searchParams.get(key);

        if (urlValue !== null) {
          const value = deserialize ? deserialize(urlValue) : urlValue;

          if (config.store[storeKey] !== value) {
            // Update store only if value is different
            const setterName = `set${storeKey.charAt(0).toUpperCase()}${storeKey.slice(1)}`;
            const setter = (config.store as Record<string, unknown>)[
              setterName
            ];

            if (typeof setter === "function") {
              setter(value);
            }
          }
        }
      }
    });
  }, [config, searchParams]);

  // Initial sync from URL
  useEffect(() => {
    syncFromUrl();
  }, [syncFromUrl]);

  return { syncToUrl, syncFromUrl };
}

/**
 * Hook to sync pagination state with URL
 */
export function usePaginationUrlSync(store: {
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
}) {
  return useUrlSync({
    store,
    paramsMap: {
      page: {
        key: "page",
        serialize: (value) => String(value),
        deserialize: (value) => parseInt(value, 10) || 1,
      },
      pageSize: {
        key: "size",
        serialize: (value) => String(value),
        deserialize: (value) => parseInt(value, 10) || 20,
      },
    },
  });
}

/**
 * Hook to sync filter state with URL
 */
export function useFilterUrlSync<T extends Record<string, unknown>>(
  filters: T,
  setFilters: (filters: Partial<T>) => void,
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const syncFiltersToUrl = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());

    // Remove existing filter params
    Array.from(params.keys()).forEach((key) => {
      if (key.startsWith("filter.")) {
        params.delete(key);
      }
    });

    // Add current filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.set(`filter.${key}`, String(value));
      }
    });

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [filters, pathname, router, searchParams]);

  const syncFiltersFromUrl = useCallback(() => {
    const urlFilters: Partial<T> = {};

    searchParams.forEach((value, key) => {
      if (key.startsWith("filter.")) {
        const filterKey = key.replace("filter.", "") as keyof T;

        urlFilters[filterKey] = value as T[keyof T];
      }
    });

    if (Object.keys(urlFilters).length > 0) {
      setFilters(urlFilters);
    }
  }, [searchParams, setFilters]);

  useEffect(() => {
    syncFiltersFromUrl();
  }, [syncFiltersFromUrl]);

  return { syncFiltersToUrl, syncFiltersFromUrl };
}
