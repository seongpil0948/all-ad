"use client";

import { ReactNode, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  SortDescriptor,
  Selection,
} from "@heroui/table";
import { Skeleton } from "@heroui/skeleton";

export interface DataTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  align?: "start" | "center" | "end";
  width?: number;
  className?: string;
  hideBelow?: "sm" | "md" | "lg";
}

export interface DataTableProps<T> {
  columns: DataTableColumn[];
  data: T[];
  renderCell: (item: T, columnKey: string) => ReactNode;
  keyField?: keyof T;
  isLoading?: boolean;
  emptyMessage?: string;
  sortDescriptor?: SortDescriptor;
  onSortChange?: (descriptor: SortDescriptor) => void;
  selectionMode?: "none" | "single" | "multiple";
  selectedKeys?: Selection;
  onSelectionChange?: (keys: Selection) => void;
  "aria-label": string;
  "data-testid"?: string;
  classNames?: {
    wrapper?: string;
    table?: string;
    thead?: string;
    tbody?: string;
    tr?: string;
    th?: string;
    td?: string;
  };
  striped?: boolean;
  density?: "compact" | "normal" | "comfortable";
  stickyHeader?: boolean;
  onRowClick?: (item: T) => void;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  renderCell,
  keyField = "id" as keyof T,
  isLoading = false,
  emptyMessage = "데이터가 없습니다",
  sortDescriptor,
  onSortChange,
  selectionMode = "none",
  selectedKeys,
  onSelectionChange,
  "aria-label": ariaLabel,
  classNames,
  striped = false,
  density = "normal",
  stickyHeader = false,
  onRowClick,
}: DataTableProps<T>) {
  // Memoize columns to prevent re-renders
  const memoizedColumns = useMemo(() => columns, [columns]);

  // Memoize table body content
  const tableContent = useMemo(() => {
    if (isLoading) {
      return (
        <TableBody>
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
        </TableBody>
      );
    }

    return (
      <TableBody emptyContent={emptyMessage}>
        {data.map((item) => (
          <TableRow
            key={String(item[keyField])}
            data-testid={`table-row-${String(item[keyField])}`}
            className={`${striped ? "odd:bg-default-50" : ""} ${
              density === "compact"
                ? "[&>td]:py-1 [&>td]:px-2"
                : density === "comfortable"
                  ? "[&>td]:py-4 [&>td]:px-4"
                  : ""
            } ${onRowClick ? "cursor-pointer hover:bg-default-100" : ""}`}
            onClick={() => onRowClick?.(item as T)}
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
                data-testid={`table-cell-${String(item[keyField])}-${columnKey as string}`}
              >
                {renderCell(item as T, columnKey as string)}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    );
  }, [
    isLoading,
    data,
    columns,
    keyField,
    renderCell,
    emptyMessage,
    striped,
    density,
    onRowClick,
  ]);

  // Memoize selection props
  const selectionProps = useMemo(() => {
    if (selectionMode === "none") return {};

    return {
      selectionMode,
      selectedKeys,
      onSelectionChange,
    };
  }, [selectionMode, selectedKeys, onSelectionChange]);

  return (
    <Table
      aria-label={ariaLabel}
      classNames={{
        ...classNames,
        thead: `${classNames?.thead || ""} ${
          stickyHeader ? "sticky top-0 z-10 bg-background" : ""
        }`,
      }}
      sortDescriptor={sortDescriptor}
      onSortChange={onSortChange}
      data-testid="data-table"
      {...selectionProps}
    >
      <TableHeader columns={memoizedColumns}>
        {(column) => (
          <TableColumn
            key={column.key}
            align={column.align}
            allowsSorting={column.sortable}
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
            data-testid={`table-header-${column.key}`}
          >
            {column.label}
          </TableColumn>
        )}
      </TableHeader>
      {tableContent}
    </Table>
  );
}
