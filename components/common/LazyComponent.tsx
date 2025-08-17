import { Suspense, ComponentType, ReactNode } from "react";
import { CircularProgress } from "@heroui/progress";
import { useDictionary } from "@/hooks/use-dictionary";

interface LazyComponentProps {
  fallback?: ReactNode;
  children: ReactNode;
}

export function LazyComponent({ fallback, children }: LazyComponentProps) {
  const { dictionary: dict } = useDictionary();
  const defaultFallback = (
    <div className="flex items-center justify-center min-h-[200px]">
      <CircularProgress aria-label={dict.common.loading} color="primary" />
    </div>
  );
  return <Suspense fallback={fallback ?? defaultFallback}>{children}</Suspense>;
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
