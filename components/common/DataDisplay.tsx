import React from "react";

import { LoadingState } from "./LoadingState";
import { ErrorState } from "./ErrorState";
import { EmptyState } from "./EmptyState";

interface DataDisplayProps<T> {
  data: T[] | null | undefined;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  emptyAction?: React.ReactNode;
  children: React.ReactNode;
}

export function DataDisplay<T>({
  data,
  loading = false,
  error = null,
  emptyMessage,
  emptyDescription,
  emptyIcon,
  emptyAction,
  children,
}: DataDisplayProps<T>) {
  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        action={emptyAction}
        description={emptyDescription}
        icon={emptyIcon}
        message={emptyMessage}
      />
    );
  }

  return <>{children}</>;
}
