"use client";

import { ReactNode } from "react";
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
import { useInfiniteScroll } from "@heroui/use-infinite-scroll";
import { AsyncListData } from "@react-stately/data";

export interface InfiniteScrollTableColumn<T> {
  key: string;
  label: string;
  align?: TableColumnProps<T>["align"];
  width?: TableColumnProps<T>["width"];
}

export interface InfiniteScrollTableProps<T> {
  columns: InfiniteScrollTableColumn<T>[];
  items: AsyncListData<T>;
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
}

export function InfiniteScrollTable<T extends { id: string | number }>({
  columns,
  items,
  renderCell,
  emptyContent = "데이터가 없습니다",
  loadingContent = <Spinner size="lg" />,
  bottomContent,
  "aria-label": ariaLabel,
  classNames,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  maxHeight = "400px",
}: InfiniteScrollTableProps<T>) {
  const [loaderRef, scrollerRef] = useInfiniteScroll({
    hasMore,
    onLoadMore,
  }) as [React.RefObject<HTMLDivElement>, React.RefObject<HTMLDivElement>];

  const defaultBottomContent =
    items.loadingState === "loadingMore" || isLoading ? (
      <div className="flex w-full justify-center py-3">
        <Spinner size="sm" />
      </div>
    ) : null;

  return (
    <div
      ref={scrollerRef}
      className={classNames?.wrapper}
      style={{
        maxHeight,
        overflow: "auto",
      }}
    >
      <Table
        aria-label={ariaLabel}
        bottomContent={bottomContent || defaultBottomContent}
        classNames={{
          base: classNames?.base || "",
          table: classNames?.table || "min-h-[100px]",
          thead: classNames?.thead,
          tbody: classNames?.tbody,
          tr: classNames?.tr,
          th: classNames?.th,
          td: classNames?.td,
        }}
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn
              key={column.key}
              align={column.align}
              width={column.width}
            >
              {column.label}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody
          emptyContent={emptyContent}
          isLoading={isLoading && items.items.length === 0}
          items={items.items}
          loadingContent={loadingContent}
        >
          {(item) => (
            <TableRow key={item.id}>
              {(columnKey) => (
                <TableCell>{renderCell(item, columnKey as string)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
      {hasMore && <div ref={loaderRef} className="h-1" />}
    </div>
  );
}
