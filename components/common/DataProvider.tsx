"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface DataProviderProps<T> {
  /**
   * 서버에서 가져온 초기 데이터
   */
  initialData: T;
  /**
   * 컴포넌트 마운트 시 실행될 콜백 함수
   * 클라이언트 사이드 상태를 초기화하는 데 사용됨
   */
  onMount: (data: T) => void;
  /**
   * 자식 컴포넌트들
   */
  children: ReactNode;
}

/**
 * 서버 데이터를 클라이언트 상태로 하이드레이션하는 제네릭 DataProvider 컴포넌트
 *
 * @description
 * 이 컴포넌트는 Next.js의 서버 컴포넌트에서 가져온 데이터를
 * 클라이언트 컴포넌트의 상태 관리 시스템(예: Zustand)으로 전달하는 역할을 합니다.
 *
 * @example
 * ```tsx
 * // 서버 컴포넌트에서
 * const data = await fetchDataFromServer();
 *
 * return (
 *   <DataProvider
 *     initialData={data}
 *     onMount={(data) => useStore.setState({ data })}
 *   >
 *     <ClientComponent />
 *   </DataProvider>
 * );
 * ```
 *
 * @template T - 초기 데이터의 타입
 */
export function DataProvider<T>({
  initialData,
  onMount,
  children,
}: DataProviderProps<T>) {
  // 컴포넌트가 이미 마운트되었는지 추적
  const isMounted = useRef(false);

  useEffect(() => {
    // 이미 마운트된 경우 중복 실행 방지
    if (isMounted.current) {
      return;
    }

    // 데이터 초기화
    onMount(initialData);

    // 마운트 상태 업데이트
    isMounted.current = true;

    // 클린업 함수
    return () => {
      isMounted.current = false;
    };
  }, [initialData, onMount]);

  return <>{children}</>;
}
