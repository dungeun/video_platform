/**
 * @company/ui-tables - UI Tables Module
 * 
 * 초세분화된 테이블 전용 모듈
 * - 테이블 컴포넌트만 담당
 * - 정렬, 필터링, 페이지네이션 기능 포함
 * - 다른 UI 요소와 완전히 분리
 * - 최소 의존성 원칙 적용
 * 
 * @version 1.0.0
 * @author Enterprise AI Team
 */

// ===== 컴포넌트 =====
export {
  Table,
  DataTable,
  TablePagination,
  ColumnManager
} from './components';

// ===== 타입 =====
export type {
  // 기본 타입
  SortDirection,
  SortConfig,
  FilterConfig,
  PaginationConfig,
  ColumnConfig,
  
  // 컴포넌트 Props
  BaseTableProps,
  SortableTableProps,
  FilterableTableProps,
  PaginatedTableProps,
  DataTableProps,
  TableHeaderProps,
  TableCellProps,
  PaginationProps,
  ColumnManagerProps,
  
  // 유틸리티 타입
  TableTheme,
  TableSize,
  TableVariant
} from './types';

// ===== 훅 =====
export {
  useTableSort,
  useTableFilter,
  useTablePagination,
  useTableSelection,
  useColumnManager
} from './hooks';

// ===== 유틸리티 =====
export {
  // Theme utilities
  getTableTheme,
  setTableTheme,
  getTableSizeStyle,
  getTableVariantStyle,
  mergeTableClasses,
  getColumnAlignClass,
  
  // Sort utilities
  toggleSortDirection,
  sortData,
  multiSort,
  getSortIcon,
  getSortClass,
  
  // Filter utilities
  applyFilter,
  filterData,
  normalizeFilterValue,
  mergeFilters,
  removeFilter,
  clearFilters,
  
  // Pagination utilities
  calculateTotalPages,
  paginateData,
  getPaginationInfo,
  getPageRange,
  getNextPage,
  getPreviousPage,
  isValidPage,
  getPageSizeOptions,
  
  // Export utilities
  exportToCSV,
  exportToJSON,
  exportSelectedRows
} from './utils';

// ===== 모듈 정보 =====
export const UI_TABLES_MODULE_INFO = {
  name: '@company/ui-tables',
  version: '1.0.0',
  description: 'Ultra-Fine-Grained UI Table Components Module',
  author: 'Enterprise AI Team',
  license: 'MIT',
  features: [
    'Basic Table Component',
    'Advanced DataTable Component',
    'Data Sorting (Single & Multi)',
    'Data Filtering',
    'Pagination Controls',
    'Row Selection',
    'Column Management',
    'Data Export (CSV/JSON)',
    'Responsive Design',
    'Sticky Headers',
    'Custom Cell Rendering',
    'Loading States',
    'Empty States',
    'TypeScript Support',
    'Accessibility Support'
  ],
  dependencies: {
    react: '>=16.8.0'
  }
} as const;