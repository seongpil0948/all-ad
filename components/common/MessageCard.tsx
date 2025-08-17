import type { MessageCardProps } from "@/types/components";

import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaInfoCircle,
} from "react-icons/fa";
import { useDictionary } from "@/hooks/use-dictionary";

export function MessageCard({ message, type, onClose }: MessageCardProps) {
  const { dictionary: dict } = useDictionary();
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
    <Card
      className={`${bgColor} ${borderColor} border`}
      data-testid="message-card"
      role="alert"
      aria-live={"polite"}
    >
      <CardBody>
        <div className="flex items-center gap-3">
          <Icon
            className={`${textColor} w-5 h-5 shrink-0`}
            aria-hidden={true}
            data-testid={`message-icon-${type}`}
          />
          <p className={textColor} data-testid="message-text">
            {message}
          </p>
          {onClose && (
            <Button
              isIconOnly
              aria-label={dict.common.close}
              className={`ml-auto ${textColor}`}
              size="sm"
              variant="light"
              onPress={onClose}
              data-testid="message-close-button"
            >
              ✕
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
