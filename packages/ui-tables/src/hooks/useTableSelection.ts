/**
 * @repo/ui-tables - useTableSelection Hook
 * 
 * 테이블 행 선택 관리 훅
 */

import { useState, useCallback } from 'react';

export function useTableSelection<T>(
  getRowKey: (row: T) => string | number
) {
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set());

  const isSelected = useCallback((row: T) => {
    const key = getRowKey(row);
    return selectedRows.has(key);
  }, [selectedRows, getRowKey]);

  const toggleSelection = useCallback((row: T) => {
    const key = getRowKey(row);
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  }, [getRowKey]);

  const selectAll = useCallback((rows: T[]) => {
    const keys = rows.map(row => getRowKey(row));
    setSelectedRows(new Set(keys));
  }, [getRowKey]);

  const deselectAll = useCallback(() => {
    setSelectedRows(new Set());
  }, []);

  const toggleSelectAll = useCallback((rows: T[]) => {
    const allKeys = rows.map(row => getRowKey(row));
    const allSelected = allKeys.every(key => selectedRows.has(key));
    
    if (allSelected) {
      deselectAll();
    } else {
      selectAll(rows);
    }
  }, [selectedRows, getRowKey, selectAll, deselectAll]);

  const getSelectedData = useCallback((data: T[]) => {
    return data.filter(row => isSelected(row));
  }, [isSelected]);

  return {
    selectedRows: Array.from(selectedRows),
    selectedCount: selectedRows.size,
    isSelected,
    toggleSelection,
    selectAll,
    deselectAll,
    toggleSelectAll,
    getSelectedData,
    hasSelection: selectedRows.size > 0
  };
}