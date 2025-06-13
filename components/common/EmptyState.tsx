import React from "react";
import { Card, CardBody } from "@heroui/card";
import { FaInbox } from "react-icons/fa";

interface EmptyStateProps {
  message?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({
  message = "데이터가 없습니다",
  description,
  icon = <FaInbox size={48} />,
  action,
}: EmptyStateProps) {
  return (
    <Card className="w-full">
      <CardBody className="flex flex-col items-center justify-center py-12">
        <div className="text-default-300 mb-4">{icon}</div>
        <h3 className="text-lg font-semibold text-default-700 mb-2">
          {message}
        </h3>
        {description && (
          <p className="text-sm text-default-500 text-center max-w-md mb-4">
            {description}
          </p>
        )}
        {action && <div className="mt-4">{action}</div>}
      </CardBody>
    </Card>
  );
}
