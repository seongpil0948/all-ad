import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Skeleton } from "@heroui/skeleton";
import { useDictionary } from "@/hooks/use-dictionary";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showActions?: boolean;
}

export function TableSkeleton({
  rows = 5,
  columns = 5,
  showActions = true,
}: TableSkeletonProps) {
  const { dictionary: dict } = useDictionary();
  const columnHeaders = Array.from({ length: columns }, (_, i) => ({
    key: `col${i}`,
    label: `Column ${i + 1}`,
  }));

  if (showActions) {
    columnHeaders.push({ key: "actions", label: "Actions" });
  }

  const rowData = Array.from({ length: rows }, (_, i) => ({ id: i }));

  return (
    <Table aria-label={dict.common.loading}>
      <TableHeader columns={columnHeaders}>
        {(column) => (
          <TableColumn key={column.key}>
            <Skeleton
              className={
                column.key === "actions" ? "w-16 rounded-lg" : "w-20 rounded-lg"
              }
            >
              <div
                className={
                  column.key === "actions"
                    ? "h-3 w-16 rounded-lg bg-default-200"
                    : "h-3 w-20 rounded-lg bg-default-200"
                }
              />
            </Skeleton>
          </TableColumn>
        )}
      </TableHeader>
      <TableBody items={rowData}>
        {(item) => (
          <TableRow key={item.id}>
            {(columnKey) => {
              const isAction = columnKey === "actions";

              return (
                <TableCell>
                  {isAction ? (
                    <Skeleton className="w-8 h-8 rounded-lg">
                      <div className="h-8 w-8 rounded-lg bg-default-200" />
                    </Skeleton>
                  ) : (
                    <Skeleton className="w-full rounded-lg">
                      <div className="h-3 w-full rounded-lg bg-default-200" />
                    </Skeleton>
                  )}
                </TableCell>
              );
            }}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
