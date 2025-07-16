import { useState, useCallback } from 'react';
import { UserAccountService } from '../services';
import { 
  PasswordChangeInput,
  PasswordResetInput,
  PasswordResetConfirmInput
} from '../types';

export function usePasswordManagement(service: UserAccountService) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const changePassword = useCallback(async (userId: string, input: PasswordChangeInput) => {
    setLoading(true);
    setError(null);

    try {
      const result = await service.changePassword(userId, input);
      
      if (!result.success) {
        setError(result.error || 'Failed to change password');
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

  const requestPasswordReset = useCallback(async (input: PasswordResetInput) => {
    setLoading(true);
    setError(null);

    try {
      const result = await service.requestPasswordReset(input);
      
      if (!result.success) {
        setError(result.error || 'Failed to request password reset');
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

  const resetPassword = useCallback(async (input: PasswordResetConfirmInput) => {
    setLoading(true);
    setError(null);

    try {
      const result = await service.resetPassword(input);
      
      if (!result.success) {
        setError(result.error || 'Failed to reset password');
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

  const validatePasswordStrength = useCallback(async (password: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await service.validatePasswordStrength(password);
      
      if (!result.success) {
        setError(result.error || 'Failed to validate password');
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

  return {
    loading,
    error,
    changePassword,
    requestPasswordReset,
    resetPassword,
    validatePasswordStrength
  };
}