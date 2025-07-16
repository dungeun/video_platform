/**
 * @repo/ui-tables - TablePagination Component
 * 
 * 테이블 페이지네이션 컴포넌트
 */

import { PaginationProps } from '../types';
import { getPageRange } from '../utils/paginationUtils';
import { mergeTableClasses } from '../utils/tableTheme';

export function TablePagination({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  showPrevNext = true,
  maxPageButtons = 5,
  className,
  variant = 'standard'
}: PaginationProps) {
  const pageRange = getPageRange(currentPage, totalPages, maxPageButtons);
  
  const baseButtonClass = 'px-3 py-1 mx-1 rounded transition-colors';
  const activeClass = 'bg-blue-500 text-white';
  const inactiveClass = 'bg-gray-200 hover:bg-gray-300 text-gray-700';
  const disabledClass = 'bg-gray-100 text-gray-400 cursor-not-allowed';

  const handlePageClick = (page: number) => {
    if (page !== currentPage && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  if (totalPages <= 1) {
    return null;
  }

  const renderPageButton = (page: number, label: string | number = page) => {
    const isActive = page === currentPage;
    const isDisabled = page < 1 || page > totalPages;

    return (
      <button
        key={`page-${page}`}
        className={mergeTableClasses(
          baseButtonClass,
          isActive ? activeClass : isDisabled ? disabledClass : inactiveClass
        )}
        onClick={() => handlePageClick(page)}
        disabled={isDisabled || isActive}
        aria-label={`Go to page ${page}`}
        aria-current={isActive ? 'page' : undefined}
      >
        {label}
      </button>
    );
  };

  if (variant === 'simple') {
    return (
      <div className={mergeTableClasses('flex items-center justify-center', className)}>
        {showPrevNext && renderPageButton(currentPage - 1, '← Previous')}
        <span className="mx-4 text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </span>
        {showPrevNext && renderPageButton(currentPage + 1, 'Next →')}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={mergeTableClasses('flex items-center', className)}>
        <select
          value={currentPage}
          onChange={(e) => handlePageClick(Number(e.target.value))}
          className="px-3 py-1 border rounded"
        >
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <option key={page} value={page}>
              Page {page}
            </option>
          ))}
        </select>
        <span className="ml-2 text-sm text-gray-600">
          of {totalPages}
        </span>
      </div>
    );
  }

  // Standard variant
  return (
    <div className={mergeTableClasses('flex items-center justify-center', className)}>
      {showFirstLast && currentPage > 1 && (
        <>
          {renderPageButton(1, '« First')}
          {pageRange[0] && pageRange[0] > 2 && <span className="mx-1">...</span>}
        </>
      )}
      
      {showPrevNext && renderPageButton(currentPage - 1, '‹')}
      
      {pageRange.map(page => renderPageButton(page))}
      
      {showPrevNext && renderPageButton(currentPage + 1, '›')}
      
      {showFirstLast && currentPage < totalPages && (
        <>
          {pageRange[pageRange.length - 1] && pageRange[pageRange.length - 1]! < totalPages - 1 && (
            <span className="mx-1">...</span>
          )}
          {renderPageButton(totalPages, 'Last »')}
        </>
      )}
    </div>
  );
}