import { ReactNode, CSSProperties } from "react";
import { AsyncListData } from "@react-stately/data";
import { TableColumnProps } from "@heroui/table";

export interface VirtualScrollTableColumn<T> {
  /**
   * Unique key for the column
   */
  key: string;

  /**
   * Display label for the column header
   */
  label: string;

  /**
   * Text alignment for the column
   */
  align?: TableColumnProps<T>["align"];

  /**
   * Width of the column (number in pixels or string with units)
   */
  width?: number | string;
}

export interface VirtualScrollTableClassNames {
  /**
   * Class name for the base container
   */
  base?: string;

  /**
   * Class name for the table element
   */
  table?: string;

  /**
   * Class name for the table header group
   */
  thead?: string;

  /**
   * Class name for the table body group
   */
  tbody?: string;

  /**
   * Class name for table rows
   */
  tr?: string;

  /**
   * Class name for table header cells
   */
  th?: string;

  /**
   * Class name for table data cells
   */
  td?: string;

  /**
   * Class name for the wrapper container
   */
  wrapper?: string;
}

export interface VirtualScrollTableProps<T extends { id: string | number }> {
  /**
   * Column definitions for the table
   */
  columns: VirtualScrollTableColumn<T>[];

  /**
   * Async list data source containing the items
   */
  items: AsyncListData<T>;

  /**
   * Function to render the content of each cell
   * @param item - The data item for the row
   * @param columnKey - The key of the column being rendered
   * @returns React node to render in the cell
   */
  renderCell: (item: T, columnKey: string) => ReactNode;

  /**
   * Content to display when the table is empty
   * @default "데이터가 없습니다"
   */
  emptyContent?: string;

  /**
   * Custom loading content to display while data is being fetched
   * If not provided, default skeleton rows will be shown
   */
  loadingContent?: ReactNode;

  /**
   * Content to display at the bottom of the table (e.g., load more button)
   * If not provided, a default spinner will be shown when loading more
   */
  bottomContent?: ReactNode;

  /**
   * ARIA label for accessibility
   */
  "aria-label": string;

  /**
   * Custom class names for styling different parts of the table
   */
  classNames?: VirtualScrollTableClassNames;

  /**
   * Whether the table is in a loading state
   * @default false
   */
  isLoading?: boolean;

  /**
   * Whether there are more items to load
   * @default false
   */
  hasMore?: boolean;

  /**
   * Callback function to load more items
   * Called automatically when scrolling near the bottom
   */
  onLoadMore?: () => void;

  /**
   * Maximum height of the scrollable area
   * @default "400px"
   */
  maxHeight?: string | number;

  /**
   * Estimated height of each row in pixels
   * Used for virtual scrolling calculations
   * @default 50
   */
  estimateSize?: number;

  /**
   * Number of items to render outside the visible area
   * Higher values provide smoother scrolling but use more memory
   * @default 5
   */
  overscan?: number;
}

export interface VirtualTableRowProps<T extends { id: string | number }> {
  /**
   * The data item for this row
   */
  item: T;

  /**
   * Column definitions
   */
  columns: VirtualScrollTableColumn<T>[];

  /**
   * Cell render function
   */
  renderCell: (item: T, columnKey: string) => ReactNode;

  /**
   * CSS styles for positioning the virtual row
   */
  style: CSSProperties;

  /**
   * Custom class names
   */
  classNames?: {
    tr?: string;
    td?: string;
  };
}
