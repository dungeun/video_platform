import { useState, useEffect, useCallback } from 'react';
import { UserAccountService } from '../services';
import { 
  UserAccount,
  UseUserAccountResult,
  UserAccountError,
  UserAccountErrorCode
} from '../types';

export function useUserAccount(
  accountId: string | null,
  service: UserAccountService
): UseUserAccountResult {
  const [account, setAccount] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccount = useCallback(async () => {
    if (!accountId) {
      setAccount(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await service.getAccount(accountId);
      
      if (result.success) {
        setAccount(result.data || null);
      } else {
        setError(result.error || 'Failed to fetch account');
        setAccount(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setAccount(null);
    } finally {
      setLoading(false);
    }
  }, [accountId, service]);

  const refetch = useCallback(async () => {
    await fetchAccount();
  }, [fetchAccount]);

  useEffect(() => {
    fetchAccount();
  }, [fetchAccount]);

  return {
    account,
    loading,
    error,
    refetch
  };
}