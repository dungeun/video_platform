/**
 * @company/ui-tables - Pagination Utilities
 * 
 * 페이지네이션 관련 유틸리티
 */

import { PaginationConfig } from '../types';

/**
 * 전체 페이지 수 계산
 */
export function calculateTotalPages(
  totalItems: number,
  pageSize: number
): number {
  return Math.ceil(totalItems / pageSize);
}

/**
 * 페이지네이션 데이터 슬라이싱
 */
export function paginateData<T>(
  data: T[],
  currentPage: number,
  pageSize: number
): T[] {
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return data.slice(startIndex, endIndex);
}

/**
 * 페이지네이션 정보 계산
 */
export function getPaginationInfo(config: PaginationConfig): {
  startIndex: number;
  endIndex: number;
  startItem: number;
  endItem: number;
} {
  const { currentPage, pageSize, totalItems } = config;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  
  return {
    startIndex,
    endIndex,
    startItem: startIndex + 1,
    endItem: endIndex
  };
}

/**
 * 페이지 버튼 범위 계산
 */
export function getPageRange(
  currentPage: number,
  totalPages: number,
  maxButtons: number = 5
): number[] {
  const halfRange = Math.floor(maxButtons / 2);
  let start = Math.max(1, currentPage - halfRange);
  let end = Math.min(totalPages, currentPage + halfRange);

  if (end - start + 1 < maxButtons) {
    if (start === 1) {
      end = Math.min(totalPages, start + maxButtons - 1);
    } else {
      start = Math.max(1, end - maxButtons + 1);
    }
  }

  const range: number[] = [];
  for (let i = start; i <= end; i++) {
    range.push(i);
  }
  return range;
}

/**
 * 다음 페이지 계산
 */
export function getNextPage(
  currentPage: number,
  totalPages: number
): number {
  return Math.min(currentPage + 1, totalPages);
}

/**
 * 이전 페이지 계산
 */
export function getPreviousPage(currentPage: number): number {
  return Math.max(currentPage - 1, 1);
}

/**
 * 페이지 유효성 검사
 */
export function isValidPage(
  page: number,
  totalPages: number
): boolean {
  return page >= 1 && page <= totalPages;
}

/**
 * 페이지 크기 옵션 생성
 */
export function getPageSizeOptions(
  defaultOptions: number[] = [10, 25, 50, 100]
): number[] {
  return defaultOptions;
}