import { useState, useCallback } from 'react';
import { Result } from '@company/core';
import { totpManager, TotpSecret } from '../utils/TotpManager';
import { useAuth } from './useAuth';

export interface TwoFactorState {
  isEnabled: boolean;
  secret?: string;
  backupCodes: string[];
  isLoading: boolean;
  error: string | null;
}

export interface UseTwoFactorResult {
  state: TwoFactorState;
  enable: (userEmail: string) => Promise<Result<TotpSecret>>;
  disable: () => Promise<Result<void>>;
  verify: (code: string) => Promise<Result<boolean>>;
  verifyBackupCode: (code: string) => Promise<Result<{ isValid: boolean; remainingCodes: string[] }>>;
  regenerateBackupCodes: () => Promise<Result<string[]>>;
  reset: () => void;
}

export const useTwoFactor = (): UseTwoFactorResult => {
  const { user, updateUserProfile } = useAuth();
  const [state, setState] = useState<TwoFactorState>({
    isEnabled: user?.twoFactorEnabled || false,
    secret: user?.twoFactorSecret,
    backupCodes: user?.backupCodes || [],
    isLoading: false,
    error: null
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading, error: null }));
  }, []);

  const setError = useCallback((error: string) => {
    setState(prev => ({ ...prev, isLoading: false, error }));
  }, []);

  const enable = useCallback(async (userEmail: string): Promise<Result<TotpSecret>> => {
    setLoading(true);

    try {
      const result = totpManager.generateSecret(userEmail);
      
      if (result.isSuccess) {
        setState(prev => ({
          ...prev,
          secret: result.data.secret,
          backupCodes: result.data.backupCodes,
          isLoading: false
        }));
        return result;
      } else {
        setError('2차 인증 설정 생성에 실패했습니다.');
        return result;
      }
    } catch (error) {
      const errorMsg = '2차 인증 활성화 중 오류가 발생했습니다.';
      setError(errorMsg);
      return Result.failure('2FA_ENABLE_FAILED', errorMsg);
    }
  }, [setLoading, setError]);

  const disable = useCallback(async (): Promise<Result<void>> => {
    setLoading(true);

    try {
      // API 호출로 서버에서 2FA 비활성화
      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        }
      });

      if (response.ok) {
        setState(prev => ({
          ...prev,
          isEnabled: false,
          secret: undefined,
          backupCodes: [],
          isLoading: false
        }));

        // 사용자 프로필 업데이트
        await updateUserProfile({
          twoFactorEnabled: false,
          twoFactorSecret: undefined,
          backupCodes: []
        });

        return Result.success(undefined);
      } else {
        const errorMsg = '2차 인증 비활성화에 실패했습니다.';
        setError(errorMsg);
        return Result.failure('2FA_DISABLE_FAILED', errorMsg);
      }
    } catch (error) {
      const errorMsg = '2차 인증 비활성화 중 오류가 발생했습니다.';
      setError(errorMsg);
      return Result.failure('2FA_DISABLE_FAILED', errorMsg);
    }
  }, [user?.token, setLoading, setError, updateUserProfile]);

  const verify = useCallback(async (code: string): Promise<Result<boolean>> => {
    if (!state.secret) {
      return Result.failure('2FA_NOT_CONFIGURED', '2차 인증이 설정되지 않았습니다.');
    }

    setLoading(true);

    try {
      const result = totpManager.verifyToken(state.secret, code);
      
      setState(prev => ({ ...prev, isLoading: false }));
      
      if (result.isSuccess) {
        return Result.success(result.data.isValid);
      } else {
        setError('인증 코드 확인에 실패했습니다.');
        return Result.failure('2FA_VERIFY_FAILED', '인증 코드 확인에 실패했습니다.');
      }
    } catch (error) {
      const errorMsg = '인증 코드 확인 중 오류가 발생했습니다.';
      setError(errorMsg);
      return Result.failure('2FA_VERIFY_FAILED', errorMsg);
    }
  }, [state.secret, setLoading, setError]);

  const verifyBackupCode = useCallback(async (code: string): Promise<Result<{ isValid: boolean; remainingCodes: string[] }>> => {
    if (state.backupCodes.length === 0) {
      return Result.failure('NO_BACKUP_CODES', '백업 코드가 없습니다.');
    }

    setLoading(true);

    try {
      const result = totpManager.verifyBackupCode(state.backupCodes, code);
      
      if (result.isSuccess && result.data.isValid) {
        // 사용된 백업 코드 제거
        setState(prev => ({
          ...prev,
          backupCodes: result.data.remainingCodes,
          isLoading: false
        }));

        // 서버에 사용된 백업 코드 업데이트
        await updateUserProfile({
          backupCodes: result.data.remainingCodes
        });
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }

      return result;
    } catch (error) {
      const errorMsg = '백업 코드 확인 중 오류가 발생했습니다.';
      setError(errorMsg);
      return Result.failure('BACKUP_CODE_VERIFY_FAILED', errorMsg);
    }
  }, [state.backupCodes, setLoading, setError, updateUserProfile]);

  const regenerateBackupCodes = useCallback(async (): Promise<Result<string[]>> => {
    setLoading(true);

    try {
      const result = totpManager.generateNewBackupCodes();
      
      if (result.isSuccess) {
        setState(prev => ({
          ...prev,
          backupCodes: result.data,
          isLoading: false
        }));

        // 서버에 새 백업 코드 업데이트
        await updateUserProfile({
          backupCodes: result.data
        });

        return result;
      } else {
        setError('새 백업 코드 생성에 실패했습니다.');
        return result;
      }
    } catch (error) {
      const errorMsg = '백업 코드 재생성 중 오류가 발생했습니다.';
      setError(errorMsg);
      return Result.failure('BACKUP_CODE_REGENERATE_FAILED', errorMsg);
    }
  }, [setLoading, setError, updateUserProfile]);

  const reset = useCallback(() => {
    setState({
      isEnabled: user?.twoFactorEnabled || false,
      secret: user?.twoFactorSecret,
      backupCodes: user?.backupCodes || [],
      isLoading: false,
      error: null
    });
  }, [user]);

  // 2FA 설정 완료 후 활성화
  const completeTwoFactorSetup = useCallback(async (secret: string, backupCodes: string[]): Promise<Result<void>> => {
    setLoading(true);

    try {
      // 서버에 2FA 설정 저장
      const response = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          secret,
          backupCodes
        })
      });

      if (response.ok) {
        setState(prev => ({
          ...prev,
          isEnabled: true,
          secret,
          backupCodes,
          isLoading: false
        }));

        // 사용자 프로필 업데이트
        await updateUserProfile({
          twoFactorEnabled: true,
          twoFactorSecret: secret,
          backupCodes
        });

        return Result.success(undefined);
      } else {
        const errorMsg = '2차 인증 설정 저장에 실패했습니다.';
        setError(errorMsg);
        return Result.failure('2FA_SETUP_FAILED', errorMsg);
      }
    } catch (error) {
      const errorMsg = '2차 인증 설정 완료 중 오류가 발생했습니다.';
      setError(errorMsg);
      return Result.failure('2FA_SETUP_FAILED', errorMsg);
    }
  }, [user?.token, setLoading, setError, updateUserProfile]);

  return {
    state,
    enable,
    disable,
    verify,
    verifyBackupCode,
    regenerateBackupCodes,
    reset
  };
};