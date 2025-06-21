import { Card, CardBody } from "@heroui/card";
import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number | ReactNode;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
}

export function StatCard({
  label,
  value,
  className = "",
  labelClassName = "text-default-500 text-sm",
  valueClassName = "text-2xl font-bold",
}: StatCardProps) {
  return (
    <Card className={className}>
      <CardBody>
        <p className={labelClassName}>{label}</p>
        <p className={valueClassName}>{value}</p>
      </CardBody>
    </Card>
  );
}
