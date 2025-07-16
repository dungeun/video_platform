/**
 * @repo/ui-tables - useTableSort Hook
 * 
 * 테이블 정렬 관리 훅
 */

import { useState, useCallback } from 'react';
import { SortConfig } from '../types';
import { toggleSortDirection, sortData } from '../utils/sortUtils';

export function useTableSort<T>(
  initialConfig?: SortConfig<T>
) {
  const [sortConfig, setSortConfig] = useState<SortConfig<T> | undefined>(
    initialConfig
  );

  const handleSort = useCallback((key: keyof T) => {
    setSortConfig(prev => {
      if (!prev || prev.key !== key) {
        return { key, direction: 'asc' };
      }
      
      const newDirection = toggleSortDirection(prev.direction);
      return newDirection ? { key, direction: newDirection } : undefined;
    });
  }, []);

  const getSortedData = useCallback((data: T[]) => {
    return sortData(data, sortConfig);
  }, [sortConfig]);

  const resetSort = useCallback(() => {
    setSortConfig(undefined);
  }, []);

  return {
    sortConfig,
    setSortConfig,
    handleSort,
    getSortedData,
    resetSort
  };
}