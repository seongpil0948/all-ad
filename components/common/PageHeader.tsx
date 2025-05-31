import { title, subtitle } from "@/components/primitives";

interface PageHeaderProps {
  pageTitle: string;
  pageSubtitle?: string;
  highlight?: string;
  centered?: boolean;
}

export function PageHeader({
  pageTitle,
  pageSubtitle,
  highlight,
  centered = false,
}: PageHeaderProps) {
  const containerClasses = centered ? "text-center" : "";

  return (
    <div className={containerClasses}>
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
    </div>
  );
}
