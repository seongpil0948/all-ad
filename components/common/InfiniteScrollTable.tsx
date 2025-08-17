"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  TableColumnProps,
} from "@heroui/table";
import { Spinner } from "@heroui/spinner";
import { Skeleton } from "@heroui/skeleton";
import { useInfiniteScroll } from "@heroui/use-infinite-scroll";
import { AsyncListData } from "@react-stately/data";
import { useDictionary } from "@/hooks/use-dictionary";

export interface InfiniteScrollTableColumn<T> {
  key: string;
  label: string;
  align?: TableColumnProps<T>["align"];
  width?: TableColumnProps<T>["width"];
  className?: string;
  hideBelow?: "sm" | "md" | "lg"; // responsive visibility control
}

export interface InfiniteScrollTableProps<T> {
  columns: InfiniteScrollTableColumn<T>[];
  items: AsyncListData<T>;
  renderCell: (item: T, columnKey: string) => ReactNode;
  emptyContent?: string;
  loadingContent?: ReactNode;
  bottomContent?: ReactNode;
  "aria-label": string;
  "data-testid"?: string;
  classNames?: {
    base?: string;
    table?: string;
    thead?: string;
    tbody?: string;
    tr?: string;
    th?: string;
    td?: string;
    wrapper?: string;
  };
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  maxHeight?: string | number;
  striped?: boolean;
  density?: "compact" | "normal" | "comfortable";
  stickyHeader?: boolean;
  onRowClick?: (item: T) => void;
}

export function InfiniteScrollTable<T extends { id: string | number }>({
  columns,
  items,
  renderCell,
  emptyContent,
  loadingContent,
  bottomContent,
  "aria-label": ariaLabel,

  classNames,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  maxHeight = "400px",
  striped = false,
  density = "normal",
  stickyHeader = false,
  onRowClick,
}: InfiniteScrollTableProps<T>) {
  const { dictionary: dict } = useDictionary();
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const previousCountRef = useRef<number>(0);
  const [liveMessage, setLiveMessage] = useState<string>("");
  const [loaderRef, scrollerRef] = useInfiniteScroll({
    hasMore,
    onLoadMore,
  }) as [React.RefObject<HTMLDivElement>, React.RefObject<HTMLDivElement>];

  const defaultBottomContent =
    items.loadingState === "loadingMore" || isLoading ? (
      <div
        className="flex w-full justify-center py-3"
        data-testid="infinite-scroll-loading"
        role="status"
        aria-label={dict.common.loadingMore}
      >
        <Spinner size="sm" />
      </div>
    ) : null;

  // Default loading content with skeleton rows
  const defaultLoadingContent = loadingContent || (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={`skeleton-${index}`}>
          {columns.map((column) => (
            <TableCell key={`skeleton-${index}-${column.key}`}>
              <Skeleton className="w-full rounded-lg">
                <div className="h-3 w-full rounded-lg bg-default-200" />
              </Skeleton>
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );

  // Compute accessibility state
  const isBusy = useMemo(
    () =>
      isLoading ||
      items.loadingState === "loading" ||
      items.loadingState === "loadingMore",
    [isLoading, items.loadingState],
  );

  // Announce loading and loaded counts
  useEffect(() => {
    const count = items.items.length;
    if (isBusy) {
      setLiveMessage(dict.common.loadingMore);
      if (liveRegionRef.current) liveRegionRef.current.ariaBusy = "true";
      return;
    }

    if (count > previousCountRef.current) {
      const added = count - previousCountRef.current;
      const msg = dict.common.loadedMore.replace("{{count}}", String(added));
      setLiveMessage(msg);
    }
    previousCountRef.current = count;
    if (liveRegionRef.current) liveRegionRef.current.ariaBusy = "false";
  }, [items.items.length, isBusy, dict]);

  return (
    <div
      ref={scrollerRef}
      className={classNames?.wrapper}
      style={{
        maxHeight,
        overflow: "auto",
      }}
      data-testid="infinite-scroll-table"
      role="region"
      aria-label={dict.common.infiniteTable || "table"}
      aria-busy={isBusy}
    >
      <div
        ref={liveRegionRef}
        aria-live={"polite"}
        aria-atomic={true}
        className="sr-only"
        data-testid="infinite-scroll-live"
      >
        {liveMessage}
      </div>
      <Table
        aria-label={ariaLabel}
        bottomContent={bottomContent || defaultBottomContent}
        classNames={{
          base: classNames?.base || "",
          table: classNames?.table || "min-h-[100px]",
          thead: `${classNames?.thead || ""} ${stickyHeader ? "sticky top-0 z-10 bg-background" : ""}`,
          tbody: classNames?.tbody,
          tr: classNames?.tr,
          th: classNames?.th,
          td: classNames?.td,
        }}
        data-testid="infinite-scroll-table"
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn
              key={column.key}
              align={column.align}
              width={column.width}
              className={`${column.className || ""} ${
                column.hideBelow === "sm"
                  ? "hidden sm:table-cell"
                  : column.hideBelow === "md"
                    ? "hidden md:table-cell"
                    : column.hideBelow === "lg"
                      ? "hidden lg:table-cell"
                      : ""
              }`}
              data-testid={`infinite-table-header-${column.key}`}
            >
              {column.label}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody
          emptyContent={emptyContent || dict.common.noData}
          isLoading={isLoading && items.items.length === 0}
          items={items.items}
          loadingContent={defaultLoadingContent}
        >
          {(item) => (
            <TableRow
              key={item.id}
              data-testid={`infinite-table-row-${item.id}`}
              className={`${striped ? "odd:bg-default-50" : ""} ${
                density === "compact"
                  ? "[&>td]:py-1 [&>td]:px-2"
                  : density === "comfortable"
                    ? "[&>td]:py-4 [&>td]:px-4"
                    : ""
              } ${onRowClick ? "cursor-pointer hover:bg-default-100" : ""}`}
              onClick={() => onRowClick?.(item)}
            >
              {(columnKey) => (
                <TableCell
                  className={`${(() => {
                    const col = columns.find(
                      (c) => c.key === (columnKey as string),
                    );
                    if (!col) return "";
                    return col.hideBelow === "sm"
                      ? "hidden sm:table-cell"
                      : col.hideBelow === "md"
                        ? "hidden md:table-cell"
                        : col.hideBelow === "lg"
                          ? "hidden lg:table-cell"
                          : "";
                  })()}`}
                  data-testid={`infinite-table-cell-${item.id}-${columnKey as string}`}
                >
                  {renderCell(item, columnKey as string)}
                </TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
      {hasMore && (
        <div
          ref={loaderRef}
          className="h-1"
          data-testid="infinite-scroll-trigger"
          aria-hidden={true}
        />
      )}
      {!hasMore && !isBusy && (
        <div
          className="sr-only"
          aria-live={"polite"}
          data-testid="infinite-scroll-end"
        >
          {dict.common.endOfList}
        </div>
      )}
    </div>
  );
}
