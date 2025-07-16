import { useState, useCallback, useEffect } from 'react';
import type { 
  Product, 
  GridLayout, 
  GridColumns, 
  GridState, 
  SortOption,
  GridConfig 
} from '../types';

export interface UseProductGridOptions {
  initialProducts?: Product[];
  itemsPerPage?: number;
  enableInfiniteScroll?: boolean;
  onFetch?: (params: {
    page: number;
    sortBy: string;
    filters: Record<string, any>;
  }) => Promise<{ products: Product[]; total: number }>;
}

export function useProductGrid(options: UseProductGridOptions = {}) {
  const {
    initialProducts = [],
    itemsPerPage = 20,
    enableInfiniteScroll = false,
    onFetch
  } = options;

  const [state, setState] = useState<GridState>({
    products: initialProducts,
    loading: false,
    error: null,
    hasMore: true,
    page: 1,
    totalPages: 1,
    totalItems: initialProducts.length,
    sortBy: 'latest',
    filters: {}
  });

  const [layout, setLayout] = useState<GridLayout>('grid');
  const [columns, setColumns] = useState<GridColumns>(4);

  const fetchProducts = useCallback(async (
    page: number,
    sortBy: string,
    filters: Record<string, any>,
    append: boolean = false
  ) => {
    if (!onFetch) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { products, total } = await onFetch({ page, sortBy, filters });
      const totalPages = Math.ceil(total / itemsPerPage);

      setState(prev => ({
        ...prev,
        products: append ? [...prev.products, ...products] : products,
        loading: false,
        page,
        totalPages,
        totalItems: total,
        hasMore: page < totalPages,
        sortBy,
        filters
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error as Error
      }));
    }
  }, [onFetch, itemsPerPage]);

  const loadMore = useCallback(() => {
    if (state.loading || !state.hasMore) return;

    fetchProducts(
      state.page + 1,
      state.sortBy,
      state.filters,
      true
    );
  }, [state.loading, state.hasMore, state.page, state.sortBy, state.filters, fetchProducts]);

  const sort = useCallback((sortBy: string) => {
    fetchProducts(1, sortBy, state.filters, false);
  }, [state.filters, fetchProducts]);

  const filter = useCallback((filters: Record<string, any>) => {
    fetchProducts(1, state.sortBy, filters, false);
  }, [state.sortBy, fetchProducts]);

  const reset = useCallback(() => {
    setState({
      products: initialProducts,
      loading: false,
      error: null,
      hasMore: true,
      page: 1,
      totalPages: 1,
      totalItems: initialProducts.length,
      sortBy: 'latest',
      filters: {}
    });
  }, [initialProducts]);

  const getConfig = useCallback((): GridConfig => ({
    layout,
    columns,
    gap: 16,
    showQuickView: true,
    showAddToCart: true,
    showWishlist: true,
    imageAspectRatio: '1/1',
    enableInfiniteScroll,
    itemsPerPage
  }), [layout, columns, enableInfiniteScroll, itemsPerPage]);

  useEffect(() => {
    if (onFetch && state.products.length === 0 && !state.loading) {
      fetchProducts(1, state.sortBy, state.filters, false);
    }
  }, []);

  return {
    ...state,
    layout,
    columns,
    setLayout,
    setColumns,
    loadMore,
    sort,
    filter,
    reset,
    getConfig
  };
}