/**
 * @company/ui-tables - Table Component
 * 
 * 기본 테이블 컴포넌트
 */

import React from 'react';
import { BaseTableProps } from '../types';
import { 
  getTableTheme, 
  mergeTableClasses,
  getColumnAlignClass 
} from '../utils/tableTheme';

export function Table<T extends Record<string, any>>({
  data,
  columns,
  className,
  style,
  loading = false,
  emptyMessage = 'No data available',
  loadingComponent,
  striped = false,
  bordered = false,
  hover = false,
  compact = false,
  responsive = true,
  stickyHeader = false,
  maxHeight,
  onRowClick,
  rowClassName,
  rowKey
}: BaseTableProps<T>) {
  const theme = getTableTheme();
  const visibleColumns = columns.filter(col => !col.hidden);

  const getRowKeyValue = (row: T, index: number): string | number => {
    if (rowKey) {
      return typeof rowKey === 'function' ? rowKey(row) : row[rowKey];
    }
    return index;
  };

  const getRowClassNames = (row: T, index: number): string => {
    const classes = [theme.row];
    
    if (striped) classes.push('even:bg-gray-50');
    if (hover) classes.push('hover:bg-gray-100');
    if (onRowClick) classes.push('cursor-pointer');
    
    if (rowClassName) {
      const customClass = typeof rowClassName === 'function' 
        ? rowClassName(row, index)
        : rowClassName;
      classes.push(customClass);
    }
    
    return mergeTableClasses(...classes);
  };

  const getCellClassNames = (column: any, value: any, row: T): string => {
    const classes = [theme.cell, getColumnAlignClass(column.align)];
    
    if (bordered) classes.push('border');
    if (compact) classes.push('py-2');
    
    if (column.cellClassName) {
      const customClass = typeof column.cellClassName === 'function'
        ? column.cellClassName(value, row)
        : column.cellClassName;
      classes.push(customClass);
    }
    
    return mergeTableClasses(...classes);
  };

  const tableWrapperStyle: React.CSSProperties = {
    ...style,
    ...(maxHeight ? { maxHeight, overflowY: 'auto' } : {})
  };

  const tableClasses = mergeTableClasses(
    theme.table,
    bordered ? 'border' : undefined,
    className
  );

  if (loading) {
    return (
      <div className={theme.loading}>
        {loadingComponent || <span>Loading...</span>}
      </div>
    );
  }

  return (
    <div 
      className={responsive ? 'overflow-x-auto' : undefined}
      style={tableWrapperStyle}
    >
      <table className={tableClasses}>
        <thead className={mergeTableClasses(theme.header, stickyHeader ? 'sticky top-0 z-10' : undefined)}>
          <tr>
            {visibleColumns.map((column) => (
              <th
                key={String(column.key)}
                className={mergeTableClasses(
                  theme.headerCell,
                  getColumnAlignClass(column.align),
                  bordered ? 'border' : undefined,
                  column.headerClassName
                )}
                style={{ 
                  width: column.width,
                  minWidth: column.minWidth,
                  maxWidth: column.maxWidth
                }}
              >
                {column.headerRender ? column.headerRender() : column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={theme.body}>
          {data.length === 0 ? (
            <tr>
              <td 
                colSpan={visibleColumns.length} 
                className={theme.empty}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={getRowKeyValue(row, rowIndex)}
                className={getRowClassNames(row, rowIndex)}
                onClick={() => onRowClick?.(row, rowIndex)}
              >
                {visibleColumns.map((column) => {
                  const value = row[column.key as keyof T];
                  const cellContent = column.render 
                    ? column.render(value, row, rowIndex)
                    : value;

                  return (
                    <td
                      key={String(column.key)}
                      className={getCellClassNames(column, value, row)}
                    >
                      {cellContent}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}