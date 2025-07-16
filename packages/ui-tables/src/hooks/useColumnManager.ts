/**
 * @company/ui-tables - useColumnManager Hook
 * 
 * 테이블 컬럼 관리 훅
 */

import { useState, useCallback } from 'react';
import { ColumnConfig } from '../types';

export function useColumnManager<T>(
  initialColumns: ColumnConfig<T>[]
) {
  const [columns, setColumns] = useState(initialColumns);

  const toggleColumnVisibility = useCallback((key: keyof T | string) => {
    setColumns(prev => 
      prev.map(col => 
        col.key === key ? { ...col, hidden: !col.hidden } : col
      )
    );
  }, []);

  const showColumn = useCallback((key: keyof T | string) => {
    setColumns(prev => 
      prev.map(col => 
        col.key === key ? { ...col, hidden: false } : col
      )
    );
  }, []);

  const hideColumn = useCallback((key: keyof T | string) => {
    setColumns(prev => 
      prev.map(col => 
        col.key === key ? { ...col, hidden: true } : col
      )
    );
  }, []);

  const reorderColumns = useCallback((fromIndex: number, toIndex: number) => {
    setColumns(prev => {
      const newColumns = [...prev];
      const [removed] = newColumns.splice(fromIndex, 1);
      if (removed) {
        newColumns.splice(toIndex, 0, removed);
      }
      return newColumns;
    });
  }, []);

  const resizeColumn = useCallback((key: keyof T | string, width: string | number) => {
    setColumns(prev => 
      prev.map(col => 
        col.key === key ? { ...col, width } : col
      )
    );
  }, []);

  const updateColumn = useCallback((key: keyof T | string, updates: Partial<ColumnConfig<T>>) => {
    setColumns(prev => 
      prev.map(col => 
        col.key === key ? { ...col, ...updates } : col
      )
    );
  }, []);

  const resetColumns = useCallback(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  const getVisibleColumns = useCallback(() => {
    return columns.filter(col => !col.hidden);
  }, [columns]);

  return {
    columns,
    setColumns,
    toggleColumnVisibility,
    showColumn,
    hideColumn,
    reorderColumns,
    resizeColumn,
    updateColumn,
    resetColumns,
    getVisibleColumns,
    visibleColumnCount: columns.filter(col => !col.hidden).length
  };
}