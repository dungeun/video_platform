/**
 * 2FA 상태 관리 훅
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  TwoFactorSession, 
  TwoFactorSetupData, 
  VerificationResult, 
  BackupCode 
} from '../types';
import { TwoFactorService } from '../services/TwoFactorService';

export interface UseTwoFactorOptions {
  userId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseTwoFactorReturn {
  // 상태
  session: TwoFactorSession | null;
  isEnabled: boolean;
  isVerified: boolean;
  isLocked: boolean;
  isLoading: boolean;
  error: string | null;
  
  // 설정 관련
  setupTwoFactor: (setupData: TwoFactorSetupData) => Promise<boolean>;
  disableTwoFactor: () => Promise<boolean>;
  regenerateBackupCodes: () => Promise<BackupCode[]>;
  
  // 검증 관련
  verifyTotp: (token: string) => Promise<VerificationResult>;
  verifyBackupCode: (code: string) => Promise<VerificationResult>;
  
  // 복구 관련
  initiateRecovery: (method: 'email' | 'phone') => Promise<string>;
  verifyRecovery: (requestId: string, code: string) => Promise<VerificationResult>;
  
  // 유틸리티
  refresh: () => Promise<void>;
  clearError: () => void;
  resetSession: () => Promise<void>;
}

export const useTwoFactor = (options: UseTwoFactorOptions): UseTwoFactorReturn => {
  const { userId, autoRefresh = false, refreshInterval = 30000 } = options;
  
  const [session, setSession] = useState<TwoFactorSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const twoFactorService = new TwoFactorService();

  // 세션 정보 로드
  const loadSession = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const sessionData = await twoFactorService.getSession(userId);
      setSession(sessionData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '세션 로드 실패');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // 초기 로드
  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // 자동 새로고침
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(loadSession, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadSession]);

  // 2FA 설정
  const setupTwoFactor = useCallback(async (setupData: TwoFactorSetupData): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const success = await twoFactorService.setup(userId, setupData);
      
      if (success) {
        await loadSession(); // 세션 새로고침
      }
      
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : '2FA 설정 실패');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId, loadSession]);

  // 2FA 비활성화
  const disableTwoFactor = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const success = await twoFactorService.disable(userId);
      
      if (success) {
        await loadSession(); // 세션 새로고침
      }
      
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : '2FA 비활성화 실패');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId, loadSession]);

  // 백업 코드 재생성
  const regenerateBackupCodes = useCallback(async (): Promise<BackupCode[]> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const newCodes = await twoFactorService.regenerateBackupCodes(userId);
      await loadSession(); // 세션 새로고침
      
      return newCodes;
    } catch (err) {
      setError(err instanceof Error ? err.message : '백업 코드 재생성 실패');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [userId, loadSession]);

  // TOTP 검증
  const verifyTotp = useCallback(async (token: string): Promise<VerificationResult> => {
    try {
      setError(null);
      
      const result = await twoFactorService.verifyTotp(userId, token);
      
      if (result.isValid) {
        await loadSession(); // 세션 새로고침
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'TOTP 검증 실패';
      setError(errorMessage);
      
      return {
        isValid: false,
        method: '2fa',
        error: errorMessage
      };
    }
  }, [userId, loadSession]);

  // 백업 코드 검증
  const verifyBackupCode = useCallback(async (code: string): Promise<VerificationResult> => {
    try {
      setError(null);
      
      const result = await twoFactorService.verifyBackupCode(userId, code);
      
      if (result.isValid) {
        await loadSession(); // 세션 새로고침
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '백업 코드 검증 실패';
      setError(errorMessage);
      
      return {
        isValid: false,
        method: 'backup-code',
        error: errorMessage
      };
    }
  }, [userId, loadSession]);

  // 복구 시작
  const initiateRecovery = useCallback(async (method: 'email' | 'phone'): Promise<string> => {
    try {
      setError(null);
      
      const requestId = await twoFactorService.initiateRecovery(userId, method);
      return requestId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '복구 시작 실패';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [userId]);

  // 복구 검증
  const verifyRecovery = useCallback(async (
    requestId: string, 
    code: string
  ): Promise<VerificationResult> => {
    try {
      setError(null);
      
      const result = await twoFactorService.verifyRecovery(requestId, code);
      
      if (result.isValid) {
        await loadSession(); // 세션 새로고침
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '복구 검증 실패';
      setError(errorMessage);
      
      return {
        isValid: false,
        method: 'recovery',
        error: errorMessage
      };
    }
  }, [loadSession]);

  // 세션 리셋
  const resetSession = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      await twoFactorService.resetSession(userId);
      await loadSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : '세션 리셋 실패');
    }
  }, [userId, loadSession]);

  // 에러 클리어
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 새로고침
  const refresh = useCallback(async (): Promise<void> => {
    await loadSession();
  }, [loadSession]);

  return {
    // 상태
    session,
    isEnabled: session?.isEnabled ?? false,
    isVerified: !!session?.lastVerified,
    isLocked: session?.lockedUntil ? session.lockedUntil > new Date() : false,
    isLoading,
    error,
    
    // 설정 관련
    setupTwoFactor,
    disableTwoFactor,
    regenerateBackupCodes,
    
    // 검증 관련
    verifyTotp,
    verifyBackupCode,
    
    // 복구 관련
    initiateRecovery,
    verifyRecovery,
    
    // 유틸리티
    refresh,
    clearError,
    resetSession
  };
};