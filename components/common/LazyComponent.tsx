import { Suspense, ComponentType, ReactNode } from "react";
import { CircularProgress } from "@heroui/progress";

interface LazyComponentProps {
  fallback?: ReactNode;
  children: ReactNode;
}

export function LazyComponent({
  fallback = (
    <div className="flex items-center justify-center min-h-[200px]">
      <CircularProgress aria-label="Loading..." color="primary" />
    </div>
  ),
  children,
}: LazyComponentProps) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}

export function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  fallback?: ReactNode,
) {
  const LazyWrappedComponent = (props: P) => (
    <LazyComponent fallback={fallback}>
      <Component {...props} />
    </LazyComponent>
  );

  LazyWrappedComponent.displayName = `LazyLoading(${Component.displayName || Component.name || "Component"})`;

  return LazyWrappedComponent;
}
