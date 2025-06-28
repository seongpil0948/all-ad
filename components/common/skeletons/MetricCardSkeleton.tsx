import { Card, CardBody } from "@heroui/card";
import { Skeleton } from "@heroui/skeleton";

export function MetricCardSkeleton() {
  return (
    <Card>
      <CardBody className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <Skeleton className="w-24 rounded-lg">
              <div className="h-3 w-24 rounded-lg bg-default-200" />
            </Skeleton>
            <Skeleton className="w-32 rounded-lg">
              <div className="h-8 w-32 rounded-lg bg-default-300" />
            </Skeleton>
            <div className="flex items-center space-x-2">
              <Skeleton className="w-4 h-4 rounded-full">
                <div className="w-4 h-4 rounded-full bg-default-200" />
              </Skeleton>
              <Skeleton className="w-16 rounded-lg">
                <div className="h-3 w-16 rounded-lg bg-default-200" />
              </Skeleton>
            </div>
          </div>
          <Skeleton className="w-10 h-10 rounded-lg">
            <div className="w-10 h-10 rounded-lg bg-default-200" />
          </Skeleton>
        </div>
      </CardBody>
    </Card>
  );
}
