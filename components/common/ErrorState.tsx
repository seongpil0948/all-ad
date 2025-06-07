import type { ErrorStateProps } from "@/types/components";

import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { FaExclamationTriangle } from "react-icons/fa";

export function ErrorState({
  title = "오류가 발생했습니다",
  message,
  onRetry,
  type = "error",
}: ErrorStateProps) {
  const colorMap = {
    error: "danger",
    warning: "warning",
    info: "primary",
  };

  const iconColorMap = {
    error: "text-danger",
    warning: "text-warning",
    info: "text-primary",
  };

  return (
    <Card className={`bg-${colorMap[type]}-50 border-${colorMap[type]}-200`}>
      <CardBody className="text-center py-8">
        <div className="flex flex-col items-center gap-4">
          <FaExclamationTriangle
            className={`w-12 h-12 ${iconColorMap[type]}`}
          />
          <div>
            <h3 className={`text-lg font-semibold text-${colorMap[type]}`}>
              {title}
            </h3>
            <p className={`text-${colorMap[type]}-700 mt-2`}>{message}</p>
          </div>
          {onRetry && (
            <Button
              color={colorMap[type] as any}
              variant="flat"
              onPress={onRetry}
            >
              다시 시도
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
