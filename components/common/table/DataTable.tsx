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
  classNames?: {
    wrapper?: string;
    table?: string;
    thead?: string;
    tbody?: string;
    tr?: string;
    th?: string;
    td?: string;
  };
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
          <TableRow key={String(item[keyField])}>
            {(columnKey) => (
              <TableCell>{renderCell(item, columnKey as string)}</TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    );
  }, [isLoading, data, columns, keyField, renderCell, emptyMessage]);

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
      classNames={classNames}
      sortDescriptor={sortDescriptor}
      onSortChange={onSortChange}
      {...selectionProps}
    >
      <TableHeader columns={memoizedColumns}>
        {(column) => (
          <TableColumn
            key={column.key}
            align={column.align}
            allowsSorting={column.sortable}
            width={column.width}
          >
            {column.label}
          </TableColumn>
        )}
      </TableHeader>
      {tableContent}
    </Table>
  );
}
