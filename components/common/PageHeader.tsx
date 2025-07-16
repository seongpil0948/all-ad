import type { PageHeaderProps } from "@/types/components";

import { title, subtitle } from "@/components/primitives";

export function PageHeader({
  pageTitle,
  pageSubtitle,
  highlight,
  centered = false,
}: PageHeaderProps) {
  const containerClasses = centered ? "text-center" : "";

  return (
    <header className={containerClasses}>
      <h1 className={title({ size: "md" })}>
        {pageTitle}
        {highlight && (
          <>
            {" "}
            <span className={title({ color: "violet", size: "md" })}>
              {highlight}
            </span>
          </>
        )}
      </h1>
      {pageSubtitle && (
        <p
          className={subtitle({
            class: `mt-2 ${centered ? "max-w-2xl mx-auto" : ""}`,
          })}
        >
          {pageSubtitle}
        </p>
      )}
    </header>
  );
}
