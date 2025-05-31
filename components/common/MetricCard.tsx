import { Card, CardBody } from "@heroui/card";
import { cn } from "@heroui/system";

interface MetricCardProps {
  label: string;
  value: string;
  change?: string;
  isNegative?: boolean;
}

export function MetricCard({
  label,
  value,
  change,
  isNegative,
}: MetricCardProps) {
  return (
    <Card>
      <CardBody>
        <p className="text-default-500 text-sm">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
        {change && (
          <p
            className={cn(
              "text-sm",
              isNegative ? "text-danger" : "text-success",
            )}
          >
            {change}
          </p>
        )}
      </CardBody>
    </Card>
  );
}
