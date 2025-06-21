"use client";

import { useEffect } from "react";

interface DataProviderProps<T> {
  initialData: T;
  onMount: (data: T) => void;
  children: React.ReactNode;
}

/**
 * Generic DataProvider component for initializing client-side state with server data
 * This follows the server-first pattern where data is fetched on the server
 * and then hydrated to client-side stores
 */
export function DataProvider<T>({ initialData, onMount, children }: DataProviderProps<T>) {
  useEffect(() => {
    onMount(initialData);
  }, [initialData, onMount]);

  return <>{children}</>;
}