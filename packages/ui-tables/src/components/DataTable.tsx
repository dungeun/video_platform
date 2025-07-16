/**
 * @company/ui-tables - DataTable Component
 * 
 * 고급 기능을 포함한 데이터 테이블 컴포넌트
 */

import { useMemo } from 'react';
import { DataTableProps } from '../types';
import { Table } from './Table';
import { TablePagination } from './TablePagination';
import { ColumnManager } from './ColumnManager';
import { 
  useTableSort,
  useTableFilter,
  useTablePagination,
  useTableSelection,
  useColumnManager
} from '../hooks';
import { 
  getSortIcon,
  getSortClass,
  exportSelectedRows,
  mergeTableClasses
} from '../utils';

export function DataTable<T extends Record<string, any>>({
  data,
  columns: initialColumns,
  
  // Sort props
  sortConfig: externalSortConfig,
  onSort: externalOnSort,
  multiSort = false,
  defaultSortConfig,
  
  // Filter props
  filters: externalFilters,
  onFilter: externalOnFilter,
  filterPosition = 'top',
  customFilters,
  
  // Pagination props
  pagination: externalPagination,
  onPageChange: externalOnPageChange,
  onPageSizeChange: externalOnPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  paginationPosition = 'bottom',
  showPageSizeSelector = true,
  showPageInfo = true,
  
  // Selection props
  selectable = false,
  selectedRows: externalSelectedRows,
  onSelectionChange: externalOnSelectionChange,
  selectAllLabel = 'Select all',
  
  // Export props
  exportable = false,
  onExport: externalOnExport,
  
  // Other props
  toolbar,
  footer,
  rowKey = 'id',
  ...tableProps
}: DataTableProps<T>) {
  // Column management
  const {
    columns,
    setColumns
  } = useColumnManager(initialColumns);

  // Sorting
  const internalSort = useTableSort<T>(defaultSortConfig);
  const sortConfig = externalSortConfig || internalSort.sortConfig;
  const handleSort = externalOnSort ? 
    (key: keyof T) => {
      const newDirection = sortConfig?.key === key 
        ? sortConfig.direction === 'asc' ? 'desc' : sortConfig.direction === 'desc' ? null : 'asc'
        : 'asc';
      externalOnSort({ key, direction: newDirection });
    } : internalSort.handleSort;

  // Filtering
  const internalFilter = useTableFilter<T>();
  const filters = externalFilters || internalFilter.filters;

  // Process data
  const processedData = useMemo(() => {
    let result = [...data];
    
    // Apply filters
    if (!externalFilters) {
      result = internalFilter.getFilteredData(result);
    }
    
    // Apply sorting
    if (!externalSortConfig) {
      result = internalSort.getSortedData(result);
    }
    
    return result;
  }, [data, filters, sortConfig, externalFilters, externalSortConfig, internalFilter, internalSort]);

  // Pagination
  const internalPagination = useTablePagination(
    processedData,
    externalPagination?.pageSize || 10
  );
  
  const currentPage = externalPagination?.currentPage || internalPagination.currentPage;
  const pageSize = externalPagination?.pageSize || internalPagination.pageSize;
  const totalItems = processedData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  
  const paginatedData = externalPagination
    ? processedData
    : internalPagination.paginatedData;

  const handlePageChange = externalOnPageChange || internalPagination.goToPage;
  const handlePageSizeChange = externalOnPageSizeChange || internalPagination.changePageSize;

  // Selection
  const getRowKeyValue = (row: T): string | number => {
    return typeof rowKey === 'function' ? rowKey(row) : row[rowKey];
  };

  const internalSelection = useTableSelection<T>(getRowKeyValue);
  const selectedCount = externalSelectedRows?.length || internalSelection.selectedCount;
  const isSelected = externalOnSelectionChange 
    ? (row: T) => externalSelectedRows?.some(r => getRowKeyValue(r) === getRowKeyValue(row)) || false
    : internalSelection.isSelected;
  const toggleSelection = externalOnSelectionChange
    ? (row: T) => {
        const key = getRowKeyValue(row);
        const newSelection = externalSelectedRows?.some(r => getRowKeyValue(r) === key)
          ? externalSelectedRows.filter(r => getRowKeyValue(r) !== key)
          : [...(externalSelectedRows || []), row];
        externalOnSelectionChange(newSelection);
      }
    : internalSelection.toggleSelection;

  // Enhanced columns with sort headers
  const enhancedColumns = columns.map(col => ({
    ...col,
    headerRender: col.sortable ? () => (
      <button
        className="flex items-center gap-1 font-medium"
        onClick={() => handleSort(col.key as keyof T)}
      >
        {col.header}
        <span className={getSortClass(
          sortConfig?.key === col.key,
          sortConfig?.key === col.key ? sortConfig.direction : null
        )}>
          {getSortIcon(sortConfig?.key === col.key ? sortConfig.direction : null)}
        </span>
      </button>
    ) : undefined
  }));

  // Add selection column
  const tableColumns = selectable 
    ? [
        {
          key: '__selection__',
          header: (
            <input
              type="checkbox"
              checked={selectedCount === paginatedData.length && selectedCount > 0}
              ref={(el) => {
                if (el) {
                  el.indeterminate = selectedCount > 0 && selectedCount < paginatedData.length;
                }
              }}
              onChange={() => internalSelection.toggleSelectAll(paginatedData)}
              aria-label={selectAllLabel}
            />
          ),
          width: '40px',
          render: (_value: any, row: T) => (
            <input
              type="checkbox"
              checked={isSelected(row)}
              onChange={() => toggleSelection(row)}
              aria-label={`Select row ${getRowKeyValue(row)}`}
            />
          )
        },
        ...enhancedColumns
      ]
    : enhancedColumns;

  const handleExport = (format: 'csv' | 'json') => {
    if (externalOnExport) {
      externalOnExport(processedData, format);
    } else {
      const selectedData = internalSelection.getSelectedData(processedData);
      exportSelectedRows(processedData, selectedData, columns, format);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      {(toolbar || exportable || filterPosition === 'top') && (
        <div className={mergeTableClasses('flex items-center justify-between', 'px-4 py-2 bg-gray-50 rounded')}>
          <div className="flex items-center gap-4">
            {toolbar}
            {exportable && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExport('csv')}
                  className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50"
                >
                  Export JSON
                </button>
              </div>
            )}
          </div>
          <ColumnManager
            columns={columns}
            onColumnsChange={setColumns}
          />
        </div>
      )}

      {/* Pagination Top */}
      {paginationPosition === 'top' || paginationPosition === 'both' && (
        <div className="flex items-center justify-between">
          {showPageInfo && (
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
            </div>
          )}
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Table */}
      <Table
        {...tableProps}
        data={paginatedData}
        columns={tableColumns}
        rowKey={rowKey}
      />

      {/* Pagination Bottom */}
      {(paginationPosition === 'bottom' || paginationPosition === 'both') && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showPageInfo && (
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
              </div>
            )}
            {showPageSizeSelector && (
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="px-3 py-1 text-sm border rounded"
              >
                {pageSizeOptions.map(size => (
                  <option key={size} value={size}>
                    {size} per page
                  </option>
                ))}
              </select>
            )}
          </div>
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Footer */}
      {footer && (
        <div className="px-4 py-2 bg-gray-50 rounded">
          {footer}
        </div>
      )}
    </div>
  );
}