/**
 * @company/ui-tables - useTablePagination Hook
 * 
 * 테이블 페이지네이션 관리 훅
 */

import { useState, useCallback, useMemo } from 'react';
import { PaginationConfig } from '../types';
import { 
  calculateTotalPages, 
  paginateData,
  getNextPage,
  getPreviousPage,
  isValidPage
} from '../utils/paginationUtils';

export function useTablePagination<T>(
  data: T[],
  initialPageSize: number = 10
) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalItems = data.length;
  const totalPages = useMemo(
    () => calculateTotalPages(totalItems, pageSize),
    [totalItems, pageSize]
  );

  const paginationConfig: PaginationConfig = useMemo(
    () => ({
      currentPage,
      pageSize,
      totalItems,
      totalPages
    }),
    [currentPage, pageSize, totalItems, totalPages]
  );

  const paginatedData = useMemo(
    () => paginateData(data, currentPage, pageSize),
    [data, currentPage, pageSize]
  );

  const goToPage = useCallback((page: number) => {
    if (isValidPage(page, totalPages)) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const goToNextPage = useCallback(() => {
    setCurrentPage(prev => getNextPage(prev, totalPages));
  }, [totalPages]);

  const goToPreviousPage = useCallback(() => {
    setCurrentPage(prev => getPreviousPage(prev));
  }, []);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  const changePageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when page size changes
  }, []);

  return {
    // State
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginationConfig,
    paginatedData,
    
    // Actions
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    changePageSize,
    
    // Helpers
    canGoNext: currentPage < totalPages,
    canGoPrevious: currentPage > 1
  };
}