import type { MessageCardProps } from "@/types/components";

import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaInfoCircle,
} from "react-icons/fa";

export function MessageCard({ message, type, onClose }: MessageCardProps) {
  const config = {
    success: {
      bgColor: "bg-success-50",
      borderColor: "border-success-200",
      textColor: "text-success",
      icon: FaCheckCircle,
    },
    error: {
      bgColor: "bg-danger-50",
      borderColor: "border-danger-200",
      textColor: "text-danger",
      icon: FaExclamationCircle,
    },
    info: {
      bgColor: "bg-primary-50",
      borderColor: "border-primary-200",
      textColor: "text-primary",
      icon: FaInfoCircle,
    },
    warning: {
      bgColor: "bg-warning-50",
      borderColor: "border-warning-200",
      textColor: "text-warning",
      icon: FaExclamationCircle,
    },
  };

  const { bgColor, borderColor, textColor, icon: Icon } = config[type];

  return (
    <Card className={`${bgColor} ${borderColor} border`}>
      <CardBody>
        <div className="flex items-center gap-3">
          <Icon className={`${textColor} w-5 h-5 shrink-0`} />
          <p className={textColor}>{message}</p>
          {onClose && (
            <Button
              isIconOnly
              aria-label="Close message"
              className={`ml-auto ${textColor}`}
              size="sm"
              variant="light"
              onPress={onClose}
            >
              ✕
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
