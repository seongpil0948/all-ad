import type { ErrorStateProps } from "@/types/components";

import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { FaExclamationTriangle } from "react-icons/fa";

import { useDictionary } from "@/hooks/use-dictionary";

export function ErrorState({
  title,
  message,
  onRetry,
  type = "error",
}: ErrorStateProps) {
  const { dictionary: dict } = useDictionary();
  const defaultTitle = title || dict.errors.general;
  const colorMap = {
    error: "danger",
    warning: "warning",
    info: "primary",
  } as const;

  const iconColorMap = {
    error: "text-danger",
    warning: "text-warning",
    info: "text-primary",
  };

  return (
    <Card
      className={`bg-${colorMap[type]}-50 border-${colorMap[type]}-200`}
      role="alert"
    >
      <CardBody className="text-center py-8">
        <div className="flex flex-col items-center gap-4">
          <FaExclamationTriangle
            aria-hidden="true"
            className={`w-12 h-12 ${iconColorMap[type]}`}
          />
          <div>
            <h3 className={`text-lg font-semibold text-${colorMap[type]}`}>
              {defaultTitle}
            </h3>
            <p className={`text-${colorMap[type]}-700 mt-2`}>{message}</p>
          </div>
          {onRetry && (
            <Button color={colorMap[type]} variant="flat" onPress={onRetry}>
              {dict.common.retry}
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
