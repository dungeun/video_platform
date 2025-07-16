import React from 'react';
import { SearchResult, SearchItem } from '../../types';

export interface SearchResultsProps<T = any> {
  result: SearchResult<T>;
  loading?: boolean;
  error?: string;
  view?: 'grid' | 'list';
  onItemClick?: (item: SearchItem<T>, index: number) => void;
  renderItem?: (item: SearchItem<T>, index: number) => React.ReactNode;
  itemClassName?: string;
  className?: string;
  emptyMessage?: string;
  showPagination?: boolean;
  onPageChange?: (page: number) => void;
}

export const SearchResults = <T extends any>({
  result,
  loading = false,
  error,
  view = 'list',
  onItemClick,
  renderItem,
  itemClassName = '',
  className = '',
  emptyMessage = 'No results found',
  showPagination = true,
  onPageChange
}: SearchResultsProps<T>) => {
  const defaultItemRenderer = (item: SearchItem<T>, index: number) => (
    <div
      key={item.id}
      className={`border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${itemClassName}`}
      onClick={() => onItemClick?.(item, index)}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-medium text-gray-900">
          {(item.source as any).title || (item.source as any).name || `Item ${item.id}`}
        </h3>
        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
          Score: {(item.score * 100).toFixed(1)}%
        </span>
      </div>
      
      {(item.source as any).description && (
        <p className="text-gray-600 mb-2">{(item.source as any).description}</p>
      )}
      
      {item.highlights && Object.keys(item.highlights).length > 0 && (
        <div className="mt-2">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Highlights:</h4>
          {Object.entries(item.highlights).map(([field, highlights]) => (
            <div key={field} className="text-sm text-gray-600">
              <strong>{field}:</strong>{' '}
              {highlights.map((highlight, i) => (
                <span key={i} dangerouslySetInnerHTML={{ __html: highlight }} />
              ))}
            </div>
          ))}
        </div>
      )}
      
      <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
        <span>ID: {item.id}</span>
        {(item.source as any).category && (
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {(item.source as any).category}
          </span>
        )}
      </div>
    </div>
  );

  const renderPagination = () => {
    if (!showPagination || !onPageChange) return null;

    const { page, totalPages } = result;
    const pages = [];
    
    // Calculate page range
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-700">
          Showing {((page - 1) * result.pageSize) + 1} to{' '}
          {Math.min(page * result.pageSize, result.total)} of{' '}
          {result.total} results
        </div>
        
        <div className="flex space-x-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {start > 1 && (
            <>
              <button
                onClick={() => onPageChange(1)}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
              >
                1
              </button>
              {start > 2 && <span className="px-3 py-2 text-sm text-gray-500">...</span>}
            </>
          )}
          
          {pages.map(pageNum => (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`px-3 py-2 text-sm font-medium border border-gray-300 hover:bg-gray-50 ${
                pageNum === page
                  ? 'bg-blue-50 text-blue-700 border-blue-500'
                  : 'text-gray-700 bg-white'
              }`}
            >
              {pageNum}
            </button>
          ))}
          
          {end < totalPages && (
            <>
              {end < totalPages - 1 && <span className="px-3 py-2 text-sm text-gray-500">...</span>}
              <button
                onClick={() => onPageChange(totalPages)}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
              >
                {totalPages}
              </button>
            </>
          )}
          
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`search-results ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Loading results...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`search-results ${className}`}>
        <div className="text-center py-12">
          <div className="text-red-500 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Search Error</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!result.items || result.items.length === 0) {
    return (
      <div className={`search-results ${className}`}>
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Results</h3>
          <p className="text-gray-600">{emptyMessage}</p>
          {result.query && (
            <p className="text-sm text-gray-500 mt-2">
              No results found for "{result.query}"
            </p>
          )}
        </div>
      </div>
    );
  }

  const containerClasses = view === 'grid' 
    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
    : 'space-y-4';

  return (
    <div className={`search-results ${className}`}>
      {/* Results summary */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600">
          {result.total > 0 && (
            <>
              {result.total.toLocaleString()} result{result.total !== 1 ? 's' : ''}
              {result.query && ` for "${result.query}"`}
              <span className="text-gray-400 ml-2">({result.took}ms)</span>
            </>
          )}
        </div>
        
        {/* View toggle */}
        <div className="flex border border-gray-300 rounded-md">
          <button
            onClick={() => {/* Toggle to list view */}}
            className={`px-3 py-1 text-sm ${
              view === 'list' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            List
          </button>
          <button
            onClick={() => {/* Toggle to grid view */}}
            className={`px-3 py-1 text-sm border-l border-gray-300 ${
              view === 'grid' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Grid
          </button>
        </div>
      </div>

      {/* Results */}
      <div className={containerClasses}>
        {result.items.map((item, index) => 
          renderItem ? renderItem(item, index) : defaultItemRenderer(item, index)
        )}
      </div>

      {/* Pagination */}
      {renderPagination()}
    </div>
  );
};