import { useState, useCallback } from 'react';
import { UserAccountService } from '../services';
import { EmailChangeInput } from '../types';

export function useEmailManagement(service: UserAccountService) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const requestEmailChange = useCallback(async (userId: string, input: EmailChangeInput) => {
    setLoading(true);
    setError(null);

    try {
      const result = await service.requestEmailChange(userId, input);
      
      if (!result.success) {
        setError(result.error || 'Failed to request email change');
        return null;
      }

      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  }, [service]);

  const confirmEmailChange = useCallback(async (token: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await service.confirmEmailChange(token);
      
      if (!result.success) {
        setError(result.error || 'Failed to confirm email change');
        return false;
      }

      return result.data || false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  }, [service]);

  const sendEmailVerification = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await service.sendEmailVerification(userId);
      
      if (!result.success) {
        setError(result.error || 'Failed to send email verification');
        return null;
      }

      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  }, [service]);

  const verifyEmail = useCallback(async (token: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await service.verifyEmail(token);
      
      if (!result.success) {
        setError(result.error || 'Failed to verify email');
        return false;
      }

      return result.data || false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  }, [service]);

  return {
    loading,
    error,
    requestEmailChange,
    confirmEmailChange,
    sendEmailVerification,
    verifyEmail
  };
}