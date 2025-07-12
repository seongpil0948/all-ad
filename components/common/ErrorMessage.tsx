import React from "react";

interface ErrorMessageProps {
  message: string;
  isSuccess?: boolean;
}

export function ErrorMessage({
  message,
  isSuccess = false,
}: ErrorMessageProps) {
  const className = `text-sm p-3 rounded ${
    isSuccess
      ? "text-success-600 bg-success-50 border border-success-200"
      : "text-danger-600 bg-danger-50 border border-danger-200"
  }`;

  return <div className={className}>{message}</div>;
}
