import { useState, useEffect, useCallback } from 'react';
import { UserAccountService } from '../services';
import { 
  UserAccount,
  UseUserAccountsResult,
  UseUserAccountsOptions
} from '../types';

export function useUserAccounts(
  options: UseUserAccountsOptions = {},
  service: UserAccountService
): UseUserAccountsResult {
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: options.page || 1,
    limit: options.limit || 20,
    total: 0,
    hasNext: false,
    hasPrev: false
  });

  const fetchAccounts = useCallback(async (currentOptions: UseUserAccountsOptions = {}) => {
    setLoading(true);
    setError(null);

    try {
      const mergedOptions = { ...options, ...currentOptions };
      const result = await service.getAccounts(mergedOptions);
      
      if (result.success && result.data) {
        setAccounts(result.data.items);
        setPagination({
          page: result.data.page,
          limit: result.data.limit,
          total: result.data.total,
          hasNext: result.data.hasNext,
          hasPrev: result.data.hasPrev
        });
      } else {
        setError(result.error || 'Failed to fetch accounts');
        setAccounts([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [options, service]);

  const refetch = useCallback(async () => {
    await fetchAccounts({ page: pagination.page });
  }, [fetchAccounts, pagination.page]);

  const nextPage = useCallback(() => {
    if (pagination.hasNext) {
      const nextPageNum = pagination.page + 1;
      setPagination(prev => ({ ...prev, page: nextPageNum }));
      fetchAccounts({ page: nextPageNum });
    }
  }, [pagination.hasNext, pagination.page, fetchAccounts]);

  const prevPage = useCallback(() => {
    if (pagination.hasPrev) {
      const prevPageNum = pagination.page - 1;
      setPagination(prev => ({ ...prev, page: prevPageNum }));
      fetchAccounts({ page: prevPageNum });
    }
  }, [pagination.hasPrev, pagination.page, fetchAccounts]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return {
    accounts,
    loading,
    error,
    pagination,
    refetch,
    nextPage,
    prevPage
  };
}