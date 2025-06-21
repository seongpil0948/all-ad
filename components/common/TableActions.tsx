import { Button } from "@heroui/button";
import { ReactNode } from "react";

interface ActionButton {
  icon?: ReactNode;
  label?: string;
  color?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger";
  variant?:
    | "solid"
    | "bordered"
    | "light"
    | "flat"
    | "faded"
    | "shadow"
    | "ghost";
  onPress: () => void;
  isDisabled?: boolean;
  isLoading?: boolean;
}

interface TableActionsProps {
  actions: ActionButton[];
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function TableActions({
  actions,
  size = "sm",
  className = "flex items-center gap-1",
}: TableActionsProps) {
  return (
    <div className={className}>
      {actions.map((action, index) => (
        <Button
          key={index}
          color={action.color}
          isDisabled={action.isDisabled}
          isIconOnly={!action.label}
          isLoading={action.isLoading}
          size={size}
          startContent={action.icon}
          variant={action.variant || "light"}
          onPress={action.onPress}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}
