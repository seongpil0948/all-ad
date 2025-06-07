import type { LoadingStateProps } from "@/types/components";

import { Spinner } from "@heroui/spinner";

export function LoadingState({
  message = "로딩 중...",
  size = "lg",
  fullScreen = false,
}: LoadingStateProps) {
  const containerClass = fullScreen
    ? "fixed inset-0 flex justify-center items-center bg-background/80 backdrop-blur-sm z-50"
    : "flex justify-center items-center h-64";

  return (
    <div className={containerClass}>
      <div className="flex flex-col items-center gap-4">
        <Spinner size={size} />
        {message && <p className="text-default-500 text-sm">{message}</p>}
      </div>
    </div>
  );
}
