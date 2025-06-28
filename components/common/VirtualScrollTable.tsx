"use client";

import { ReactNode, useMemo, memo, useRef, CSSProperties } from "react";
import { TableColumnProps } from "@heroui/table";
import { Spinner } from "@heroui/spinner";
import { Skeleton } from "@heroui/skeleton";
import { AsyncListData } from "@react-stately/data";
import { useVirtualizer } from "@tanstack/react-virtual";
import clsx from "clsx";

export interface VirtualScrollTableColumn<T> {
  key: string;
  label: string;
  align?: TableColumnProps<T>["align"];
  width?: TableColumnProps<T>["width"];
}

export interface VirtualScrollTableProps<T> {
  columns: VirtualScrollTableColumn<T>[];
  items: AsyncListData<T> | T[];
  renderCell: (item: T, columnKey: string) => ReactNode;
  emptyContent?: string;
  loadingContent?: ReactNode;
  bottomContent?: ReactNode;
  "aria-label": string;
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
  estimateSize?: number; // Height of each row for virtualization
  overscan?: number; // Number of items to render outside visible area
}

// Memoized table row component for performance
const VirtualTableRow = memo(
  <T extends { id: string | number }>({
    item,
    columns,
    renderCell,
    style,
    classNames,
  }: {
    item: T;
    columns: VirtualScrollTableColumn<T>[];
    renderCell: (item: T, columnKey: string) => ReactNode;
    style: CSSProperties;
    classNames?: {
      tr?: string;
      td?: string;
    };
  }) => {
    return (
      <div
        className={clsx(
          "table-row",
          classNames?.tr,
          "border-b border-default-200",
        )}
        style={style}
      >
        {columns.map((column) => (
          <div
            key={column.key}
            className={clsx(
              "table-cell",
              classNames?.td,
              "px-3 py-2 align-middle",
            )}
            style={{
              width: column.width || undefined,
              textAlign: column.align || "start",
            }}
          >
            {renderCell(item, column.key)}
          </div>
        ))}
      </div>
    );
  },
);

VirtualTableRow.displayName = "VirtualTableRow";

export function VirtualScrollTable<T extends { id: string | number }>({
  columns,
  items,
  renderCell,
  emptyContent = "데이터가 없습니다",
  loadingContent,
  bottomContent,
  "aria-label": ariaLabel,
  classNames,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  maxHeight = "400px",
  estimateSize = 50,
  overscan = 5,
}: VirtualScrollTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const scrollingRef = useRef<HTMLDivElement>(null);

  // Memoize items array to prevent unnecessary re-renders
  const itemsArray = useMemo(() => {
    return Array.isArray(items) ? items : items.items;
  }, [items]);

  // Determine loading state based on items type
  const loadingState = Array.isArray(items) ? undefined : items.loadingState;

  const virtualizer = useVirtualizer({
    count: itemsArray.length,
    getScrollElement: () => scrollingRef.current,
    estimateSize: () => estimateSize,
    overscan,
    getItemKey: (index) => itemsArray[index]?.id?.toString() || index,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Check if we need to load more when scrolling near the bottom
  const lastItem = virtualItems[virtualItems.length - 1];
  const isNearBottom = lastItem && lastItem.index >= itemsArray.length - 5;

  // Trigger load more when near bottom
  if (isNearBottom && hasMore && !isLoading && onLoadMore) {
    onLoadMore();
  }

  const defaultBottomContent =
    loadingState === "loadingMore" || isLoading ? (
      <div className="flex w-full justify-center py-3">
        <Spinner size="sm" />
      </div>
    ) : null;

  // Default loading content with skeleton rows
  const defaultLoadingContent = loadingContent || (
    <div className="table-row-group">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={`skeleton-${index}`} className="table-row">
          {columns.map((column) => (
            <div
              key={`skeleton-${index}-${column.key}`}
              className="table-cell px-3 py-2"
            >
              <Skeleton className="w-full rounded-lg">
                <div className="h-3 w-full rounded-lg bg-default-200" />
              </Skeleton>
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  const totalHeight = virtualizer.getTotalSize();

  return (
    <div
      ref={parentRef}
      aria-label={ariaLabel}
      className={clsx("relative", classNames?.wrapper)}
    >
      <div
        ref={scrollingRef}
        className="overflow-auto"
        style={{
          maxHeight,
        }}
      >
        <div
          className={clsx("table w-full", classNames?.table || "min-h-[100px]")}
        >
          {/* Table Header */}
          <div className={clsx("table-header-group", classNames?.thead)}>
            <div className="table-row">
              {columns.map((column) => (
                <div
                  key={column.key}
                  className={clsx(
                    "table-cell px-3 py-2 font-semibold bg-default-100",
                    classNames?.th,
                  )}
                  style={{
                    width: column.width || undefined,
                    textAlign: column.align || "start",
                  }}
                >
                  {column.label}
                </div>
              ))}
            </div>
          </div>

          {/* Table Body */}
          <div
            className={clsx("table-row-group relative", classNames?.tbody)}
            style={{
              height: itemsArray.length > 0 ? `${totalHeight}px` : "auto",
              minHeight: "100px",
            }}
          >
            {isLoading && itemsArray.length === 0 ? (
              defaultLoadingContent
            ) : itemsArray.length === 0 ? (
              <div className="table-row">
                <div
                  className="table-cell text-center py-8 text-default-400"
                  style={{ width: "100%" }}
                >
                  {emptyContent}
                </div>
              </div>
            ) : (
              virtualItems.map((virtualItem) => {
                const item = itemsArray[virtualItem.index];

                if (!item) return null;

                return (
                  <VirtualTableRow
                    key={virtualItem.key}
                    classNames={{
                      tr: classNames?.tr,
                      td: classNames?.td,
                    }}
                    columns={columns}
                    item={item}
                    renderCell={
                      renderCell as (
                        item: { id: string | number },
                        columnKey: string,
                      ) => ReactNode
                    }
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Bottom Content */}
        {(bottomContent || defaultBottomContent) && (
          <div className="sticky bottom-0 left-0 right-0 bg-background">
            {bottomContent || defaultBottomContent}
          </div>
        )}
      </div>
    </div>
  );
}

// Export memoized version by default
export default memo(VirtualScrollTable) as typeof VirtualScrollTable;
