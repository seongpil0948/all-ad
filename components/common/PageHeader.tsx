import type { PageHeaderProps } from "@/types/components";

import { title, subtitle } from "@/components/primitives";

export function PageHeader({
  pageTitle,
  pageSubtitle,
  highlight,
  centered = false,
  actions,
  className,
}: PageHeaderProps & { "data-testid"?: string }) {
  const containerClasses = `${centered ? "text-center" : ""} ${className || ""}`;

  return (
    <header
      className={containerClasses}
      data-testid="page-header"
      role="banner"
    >
      <div
        className={`flex ${centered ? "flex-col items-center" : "items-center justify-between gap-3"}`}
      >
        <h1 className={title({ size: "md" })} data-testid="page-title">
          {pageTitle}
          {highlight && (
            <>
              {" "}
              <span
                className={title({ color: "violet", size: "md" })}
                data-testid="page-title-highlight"
              >
                {highlight}
              </span>
            </>
          )}
        </h1>
        {actions && (
          <div className="mt-2 sm:mt-0" data-testid="page-header-actions">
            {actions}
          </div>
        )}
      </div>
      {pageSubtitle && (
        <p
          className={subtitle({
            class: `mt-2 ${centered ? "max-w-2xl mx-auto" : ""}`,
          })}
          data-testid="page-subtitle"
        >
          {pageSubtitle}
        </p>
      )}
    </header>
  );
}
