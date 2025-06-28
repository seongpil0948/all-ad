import { Card } from "@heroui/card";
import { Skeleton } from "@heroui/skeleton";

interface ChartSkeletonProps {
  className?: string;
  height?: string;
}

export function ChartSkeleton({
  className = "",
  height = "h-80",
}: ChartSkeletonProps) {
  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="w-32 rounded-lg">
            <div className="h-4 w-32 rounded-lg bg-default-200" />
          </Skeleton>
          <Skeleton className="w-24 rounded-lg">
            <div className="h-8 w-24 rounded-lg bg-default-200" />
          </Skeleton>
        </div>

        <Skeleton className={`rounded-lg w-full ${height}`}>
          <div className={`w-full ${height} rounded-lg bg-default-100`} />
        </Skeleton>

        <div className="flex justify-center space-x-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-2">
              <Skeleton className="w-3 h-3 rounded-full">
                <div className="w-3 h-3 rounded-full bg-default-200" />
              </Skeleton>
              <Skeleton className="w-16 rounded-lg">
                <div className="h-3 w-16 rounded-lg bg-default-200" />
              </Skeleton>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
