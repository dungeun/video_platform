/**
 * @repo/ui-tables - Sort Utilities
 * 
 * 테이블 정렬 관련 유틸리티
 */

import { SortConfig, SortDirection } from '../types';

/**
 * 정렬 방향 토글
 */
export function toggleSortDirection(current: SortDirection): SortDirection {
  if (current === null) return 'asc';
  if (current === 'asc') return 'desc';
  return null;
}

/**
 * 데이터 정렬
 */
export function sortData<T>(
  data: T[],
  sortConfig: SortConfig<T> | undefined
): T[] {
  if (!sortConfig || sortConfig.direction === null) {
    return data;
  }

  return [...data].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue === bValue) return 0;
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    const comparison = aValue < bValue ? -1 : 1;
    return sortConfig.direction === 'asc' ? comparison : -comparison;
  });
}

/**
 * 다중 정렬 설정
 */
export function multiSort<T>(
  data: T[],
  sortConfigs: SortConfig<T>[]
): T[] {
  if (!sortConfigs.length) return data;

  return [...data].sort((a, b) => {
    for (const config of sortConfigs) {
      if (config.direction === null) continue;

      const aValue = a[config.key];
      const bValue = b[config.key];

      if (aValue !== bValue) {
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        const comparison = aValue < bValue ? -1 : 1;
        return config.direction === 'asc' ? comparison : -comparison;
      }
    }
    return 0;
  });
}

/**
 * 정렬 아이콘 가져오기
 */
export function getSortIcon(direction: SortDirection): string {
  switch (direction) {
    case 'asc':
      return '↑';
    case 'desc':
      return '↓';
    default:
      return '↕';
  }
}

/**
 * 정렬 상태 클래스 가져오기
 */
export function getSortClass(
  isActive: boolean,
  direction: SortDirection
): string {
  const baseClass = 'cursor-pointer select-none';
  if (!isActive) return `${baseClass} text-gray-400`;
  
  return direction === 'asc' 
    ? `${baseClass} text-blue-600`
    : `${baseClass} text-blue-600`;
}