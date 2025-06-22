import { Card } from "@heroui/card";
import { Skeleton } from "@heroui/skeleton";

interface CardSkeletonProps {
  className?: string;
  showIcon?: boolean;
}

export function CardSkeleton({
  className = "",
  showIcon = true,
}: CardSkeletonProps) {
  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-3">
        {showIcon && (
          <Skeleton className="rounded-lg w-12 h-12">
            <div className="h-12 w-12 rounded-lg bg-default-300" />
          </Skeleton>
        )}
        <Skeleton className="w-3/5 rounded-lg">
          <div className="h-3 w-3/5 rounded-lg bg-default-200" />
        </Skeleton>
        <Skeleton className="w-full rounded-lg">
          <div className="h-8 w-full rounded-lg bg-default-300" />
        </Skeleton>
        <Skeleton className="w-2/5 rounded-lg">
          <div className="h-3 w-2/5 rounded-lg bg-default-200" />
        </Skeleton>
      </div>
    </Card>
  );
}
