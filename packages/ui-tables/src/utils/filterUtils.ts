/**
 * @company/ui-tables - Filter Utilities
 * 
 * 테이블 필터링 관련 유틸리티
 */

import { FilterConfig } from '../types';

/**
 * 필터 적용
 */
export function applyFilter(
  value: any,
  filterValue: any,
  operator: FilterConfig['operator'] = 'contains'
): boolean {
  if (filterValue === null || filterValue === undefined || filterValue === '') {
    return true;
  }

  const stringValue = String(value).toLowerCase();
  const stringFilterValue = String(filterValue).toLowerCase();

  switch (operator) {
    case 'equals':
      return stringValue === stringFilterValue;
    case 'contains':
      return stringValue.includes(stringFilterValue);
    case 'startsWith':
      return stringValue.startsWith(stringFilterValue);
    case 'endsWith':
      return stringValue.endsWith(stringFilterValue);
    case 'gt':
      return Number(value) > Number(filterValue);
    case 'lt':
      return Number(value) < Number(filterValue);
    case 'gte':
      return Number(value) >= Number(filterValue);
    case 'lte':
      return Number(value) <= Number(filterValue);
    default:
      return true;
  }
}

/**
 * 데이터 필터링
 */
export function filterData<T>(
  data: T[],
  filters: FilterConfig<T>[]
): T[] {
  if (!filters.length) return data;

  return data.filter(row => {
    return filters.every(filter => {
      const value = row[filter.key];
      return applyFilter(value, filter.value, filter.operator);
    });
  });
}

/**
 * 필터 값 정규화
 */
export function normalizeFilterValue(value: any): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

/**
 * 필터 설정 병합
 */
export function mergeFilters<T>(
  existing: FilterConfig<T>[],
  newFilter: FilterConfig<T>
): FilterConfig<T>[] {
  const index = existing.findIndex(f => f.key === newFilter.key);
  
  if (index >= 0) {
    const updated = [...existing];
    updated[index] = newFilter;
    return updated;
  }
  
  return [...existing, newFilter];
}

/**
 * 필터 제거
 */
export function removeFilter<T>(
  filters: FilterConfig<T>[],
  key: keyof T
): FilterConfig<T>[] {
  return filters.filter(f => f.key !== key);
}

/**
 * 모든 필터 초기화
 */
export function clearFilters<T>(): FilterConfig<T>[] {
  return [];
}