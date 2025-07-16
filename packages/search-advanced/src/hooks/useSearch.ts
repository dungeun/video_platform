import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  SearchParams, 
  SearchResult, 
  SearchFilters,
  SortParams,
  PaginationParams 
} from '../types';
import { SearchService } from '../services/SearchService';

export interface UseSearchOptions {
  searchService: SearchService;
  debounceMs?: number;
  autoSearch?: boolean;
  initialParams?: Partial<SearchParams>;
}

export interface UseSearchReturn<T = any> {
  // State
  result: SearchResult<T> | null;
  loading: boolean;
  error: string | null;
  
  // Current parameters
  query: string;
  filters: SearchFilters;
  sort: SortParams | undefined;
  pagination: PaginationParams;
  
  // Actions
  search: (params?: Partial<SearchParams>) => Promise<void>;
  setQuery: (query: string) => void;
  setFilters: (filters: SearchFilters) => void;
  setSort: (sort: SortParams) => void;
  setPagination: (pagination: PaginationParams) => void;
  reset: () => void;
  
  // Utilities
  hasResults: boolean;
  totalPages: number;
  isFirstPage: boolean;
  isLastPage: boolean;
  
  // Navigation
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
}

export const useSearch = <T = any>({
  searchService,
  debounceMs = 300,
  autoSearch = true,
  initialParams = {}
}: UseSearchOptions): UseSearchReturn<T> => {
  const [result, setResult] = useState<SearchResult<T> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [query, setQuery] = useState(initialParams.query || '');
  const [filters, setFilters] = useState<SearchFilters>(initialParams.filters || {});
  const [sort, setSort] = useState<SortParams | undefined>(initialParams.sort);
  const [pagination, setPagination] = useState<PaginationParams>(
    initialParams.pagination || { page: 1, pageSize: 20 }
  );

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Perform search
  const performSearch = useCallback(async (params?: Partial<SearchParams>) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    const searchParams: SearchParams = {
      query,
      filters,
      sort,
      pagination,
      ...params
    };

    // Don't search if no query and no filters
    if (!searchParams.query && Object.keys(searchParams.filters || {}).length === 0) {
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const searchResult = await searchService.search<T>(searchParams);
      
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setResult(searchResult);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Search failed');
        setResult(null);
      }
    } finally {
      setLoading(false);
    }
  }, [searchService, query, filters, sort, pagination]);

  // Debounced search
  const debouncedSearch = useCallback((params?: Partial<SearchParams>) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      performSearch(params);
    }, debounceMs);
  }, [performSearch, debounceMs]);

  // Main search function
  const search = useCallback(async (params?: Partial<SearchParams>) => {
    if (debounceMs > 0) {
      debouncedSearch(params);
    } else {
      await performSearch(params);
    }
  }, [performSearch, debouncedSearch, debounceMs]);

  // Auto search when parameters change
  useEffect(() => {
    if (autoSearch) {
      search();
    }
  }, [query, filters, sort, pagination, autoSearch, search]);

  // Update query with search
  const updateQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
    // Reset to first page when query changes
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Update filters with search
  const updateFilters = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters);
    // Reset to first page when filters change
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Update sort with search
  const updateSort = useCallback((newSort: SortParams) => {
    setSort(newSort);
    // Reset to first page when sort changes
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Reset search state
  const reset = useCallback(() => {
    setQuery('');
    setFilters({});
    setSort(undefined);
    setPagination({ page: 1, pageSize: 20 });
    setResult(null);
    setError(null);
    
    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  }, []);

  // Navigation helpers
  const totalPages = result?.totalPages || 0;
  const isFirstPage = pagination.page === 1;
  const isLastPage = pagination.page >= totalPages;

  const nextPage = useCallback(() => {
    if (!isLastPage) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }));
    }
  }, [isLastPage]);

  const prevPage = useCallback(() => {
    if (!isFirstPage) {
      setPagination(prev => ({ ...prev, page: prev.page - 1 }));
    }
  }, [isFirstPage]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setPagination(prev => ({ ...prev, page }));
    }
  }, [totalPages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    result,
    loading,
    error,
    
    // Current parameters
    query,
    filters,
    sort,
    pagination,
    
    // Actions
    search,
    setQuery: updateQuery,
    setFilters: updateFilters,
    setSort: updateSort,
    setPagination,
    reset,
    
    // Utilities
    hasResults: Boolean(result && result.items.length > 0),
    totalPages,
    isFirstPage,
    isLastPage,
    
    // Navigation
    nextPage,
    prevPage,
    goToPage
  };
};