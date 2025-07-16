/**
 * @company/ui-tables - Types
 * 
 * 테이블 컴포넌트 전용 타입 정의
 */

import { ReactNode, CSSProperties } from 'react';

// ===== 기본 타입 =====

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig<T = any> {
  key: keyof T;
  direction: SortDirection;
}

export interface FilterConfig<T = any> {
  key: keyof T;
  value: any;
  operator?: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'gte' | 'lte';
}

export interface PaginationConfig {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages?: number;
}

export interface ColumnConfig<T = any> {
  key: keyof T | string;
  header: string | ReactNode;
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  filterable?: boolean;
  resizable?: boolean;
  hidden?: boolean;
  sticky?: boolean;
  render?: (value: any, row: T, rowIndex: number) => ReactNode;
  headerRender?: (() => ReactNode) | undefined;
  className?: string;
  headerClassName?: string;
  cellClassName?: string | ((value: any, row: T) => string);
}

// ===== 컴포넌트 Props =====

export interface BaseTableProps<T = any> {
  data: T[];
  columns: ColumnConfig<T>[];
  className?: string;
  style?: CSSProperties;
  loading?: boolean;
  emptyMessage?: string | ReactNode;
  loadingComponent?: ReactNode;
  striped?: boolean;
  bordered?: boolean;
  hover?: boolean;
  compact?: boolean;
  responsive?: boolean;
  stickyHeader?: boolean;
  maxHeight?: string | number;
  onRowClick?: (row: T, index: number) => void;
  rowClassName?: string | ((row: T, index: number) => string);
  rowKey?: keyof T | ((row: T) => string | number);
}

export interface SortableTableProps<T = any> extends BaseTableProps<T> {
  sortConfig?: SortConfig<T>;
  onSort?: (config: SortConfig<T>) => void;
  multiSort?: boolean;
  defaultSortConfig?: SortConfig<T>;
}

export interface FilterableTableProps<T = any> extends BaseTableProps<T> {
  filters?: FilterConfig<T>[];
  onFilter?: (filters: FilterConfig<T>[]) => void;
  filterPosition?: 'top' | 'inline' | 'sidebar';
  customFilters?: Record<string, ReactNode>;
}

export interface PaginatedTableProps<T = any> extends BaseTableProps<T> {
  pagination: PaginationConfig;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  paginationPosition?: 'top' | 'bottom' | 'both';
  showPageSizeSelector?: boolean;
  showPageInfo?: boolean;
}

export interface DataTableProps<T = any> extends 
  SortableTableProps<T>, 
  FilterableTableProps<T>, 
  PaginatedTableProps<T> {
  selectable?: boolean;
  selectedRows?: T[];
  onSelectionChange?: (selectedRows: T[]) => void;
  selectAllLabel?: string;
  exportable?: boolean;
  onExport?: (data: T[], format: 'csv' | 'excel' | 'json') => void;
  toolbar?: ReactNode;
  footer?: ReactNode;
}

// ===== 테이블 헤더/셀 Props =====

export interface TableHeaderProps<T = any> {
  columns: ColumnConfig<T>[];
  sortConfig?: SortConfig<T>;
  onSort?: (key: keyof T) => void;
  selectable?: boolean;
  allSelected?: boolean;
  onSelectAll?: () => void;
  className?: string;
}

export interface TableCellProps {
  children: ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
  style?: CSSProperties;
  colSpan?: number;
  rowSpan?: number;
}

// ===== 페이지네이션 Props =====

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  maxPageButtons?: number;
  className?: string;
  variant?: 'simple' | 'standard' | 'compact';
}

// ===== 컬럼 관리 Props =====

export interface ColumnManagerProps<T = any> {
  columns: ColumnConfig<T>[];
  onColumnsChange: (columns: ColumnConfig<T>[]) => void;
  allowHiding?: boolean;
  allowReordering?: boolean;
  allowResizing?: boolean;
  className?: string;
}

// ===== 유틸리티 타입 =====

export type TableTheme = {
  table?: string;
  header?: string;
  headerCell?: string;
  body?: string;
  row?: string;
  cell?: string;
  pagination?: string;
  toolbar?: string;
  filter?: string;
  loading?: string;
  empty?: string;
};

export type TableSize = 'small' | 'medium' | 'large';

export type TableVariant = 'simple' | 'striped' | 'bordered' | 'hover';