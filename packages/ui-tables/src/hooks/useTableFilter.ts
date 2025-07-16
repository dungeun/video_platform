/**
 * @company/ui-tables - useTableFilter Hook
 * 
 * 테이블 필터링 관리 훅
 */

import { useState, useCallback } from 'react';
import { FilterConfig } from '../types';
import { filterData, mergeFilters, removeFilter, clearFilters } from '../utils/filterUtils';

export function useTableFilter<T>() {
  const [filters, setFilters] = useState<FilterConfig<T>[]>([]);

  const addFilter = useCallback((filter: FilterConfig<T>) => {
    setFilters(prev => mergeFilters(prev, filter));
  }, []);

  const updateFilter = useCallback((key: keyof T, value: any, operator: FilterConfig['operator'] = 'contains') => {
    const filter: FilterConfig<T> = { key, value, operator };
    setFilters(prev => mergeFilters(prev, filter));
  }, []);

  const deleteFilter = useCallback((key: keyof T) => {
    setFilters(prev => removeFilter(prev, key));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(clearFilters());
  }, []);

  const getFilteredData = useCallback((data: T[]) => {
    return filterData(data, filters);
  }, [filters]);

  const hasActiveFilters = filters.length > 0;

  return {
    filters,
    setFilters,
    addFilter,
    updateFilter,
    deleteFilter,
    resetFilters,
    getFilteredData,
    hasActiveFilters
  };
}