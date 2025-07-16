/**
 * 2FA 컨텍스트 프로바이더
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { 
  TwoFactorSession, 
  TwoFactorSetupData, 
  VerificationResult,
  BackupCode 
} from '../types';
import { TwoFactorService } from '../services/TwoFactorService';

// 상태 타입
interface TwoFactorState {
  session: TwoFactorSession | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

// 액션 타입
type TwoFactorAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SESSION'; payload: TwoFactorSession | null }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'RESET' };

// 컨텍스트 타입
interface TwoFactorContextType {
  // 상태
  state: TwoFactorState;
  
  // 편의 속성
  isEnabled: boolean;
  isVerified: boolean;
  isLocked: boolean;
  
  // 액션
  initializeSetup: (userId: string) => Promise<{
    secret: string;
    qrCodeDataUrl: string;
    manualEntryKey: string;
  }>;
  setupTwoFactor: (userId: string, setupData: TwoFactorSetupData) => Promise<boolean>;
  disableTwoFactor: (userId: string) => Promise<boolean>;
  verifyTotp: (userId: string, token: string) => Promise<VerificationResult>;
  verifyBackupCode: (userId: string, code: string) => Promise<VerificationResult>;
  regenerateBackupCodes: (userId: string) => Promise<BackupCode[]>;
  initiateRecovery: (userId: string, method: 'email' | 'phone') => Promise<string>;
  verifyRecovery: (requestId: string, code: string) => Promise<VerificationResult>;
  loadSession: (userId: string) => Promise<void>;
  resetSession: (userId: string) => Promise<void>;
  clearError: () => void;
}

// 초기 상태
const initialState: TwoFactorState = {
  session: null,
  isLoading: false,
  error: null,
  isInitialized: false
};

// 리듀서
const twoFactorReducer = (state: TwoFactorState, action: TwoFactorAction): TwoFactorState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_SESSION':
      return { ...state, session: action.payload, isLoading: false };
    
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };
    
    case 'RESET':
      return initialState;
    
    default:
      return state;
  }
};

// 컨텍스트 생성
const TwoFactorContext = createContext<TwoFactorContextType | null>(null);

// 프로바이더 Props
interface TwoFactorProviderProps {
  children: React.ReactNode;
  serviceConfig?: any;
}

// 프로바이더 컴포넌트
export const TwoFactorProvider: React.FC<TwoFactorProviderProps> = ({
  children,
  serviceConfig
}) => {
  const [state, dispatch] = useReducer(twoFactorReducer, initialState);
  const twoFactorService = new TwoFactorService(serviceConfig);

  // 에러 헬퍼
  const handleError = useCallback((error: unknown, defaultMessage: string) => {
    const message = error instanceof Error ? error.message : defaultMessage;
    dispatch({ type: 'SET_ERROR', payload: message });
    console.error(defaultMessage, error);
  }, []);

  // 2FA 설정 초기화
  const initializeSetup = useCallback(async (userId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const setupData = await twoFactorService.initializeSetup(userId);
      
      return setupData;
    } catch (error) {
      handleError(error, '2FA 설정 초기화 실패');
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [twoFactorService, handleError]);

  // 2FA 설정 완료
  const setupTwoFactor = useCallback(async (
    userId: string, 
    setupData: TwoFactorSetupData
  ): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const success = await twoFactorService.setup(userId, setupData);
      
      if (success) {
        // 세션 새로고침
        const session = await twoFactorService.getSession(userId);
        dispatch({ type: 'SET_SESSION', payload: session });
      }
      
      return success;
    } catch (error) {
      handleError(error, '2FA 설정 실패');
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [twoFactorService, handleError]);

  // 2FA 비활성화
  const disableTwoFactor = useCallback(async (userId: string): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const success = await twoFactorService.disable(userId);
      
      if (success) {
        dispatch({ type: 'SET_SESSION', payload: null });
      }
      
      return success;
    } catch (error) {
      handleError(error, '2FA 비활성화 실패');
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [twoFactorService, handleError]);

  // TOTP 검증
  const verifyTotp = useCallback(async (
    userId: string, 
    token: string
  ): Promise<VerificationResult> => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const result = await twoFactorService.verifyTotp(userId, token);
      
      if (result.isValid) {
        // 세션 새로고침
        const session = await twoFactorService.getSession(userId);
        dispatch({ type: 'SET_SESSION', payload: session });
      }
      
      return result;
    } catch (error) {
      const errorMessage = 'TOTP 검증 실패';
      handleError(error, errorMessage);
      
      return {
        isValid: false,
        method: '2fa',
        error: errorMessage
      };
    }
  }, [twoFactorService, handleError]);

  // 백업 코드 검증
  const verifyBackupCode = useCallback(async (
    userId: string, 
    code: string
  ): Promise<VerificationResult> => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const result = await twoFactorService.verifyBackupCode(userId, code);
      
      if (result.isValid) {
        // 세션 새로고침
        const session = await twoFactorService.getSession(userId);
        dispatch({ type: 'SET_SESSION', payload: session });
      }
      
      return result;
    } catch (error) {
      const errorMessage = '백업 코드 검증 실패';
      handleError(error, errorMessage);
      
      return {
        isValid: false,
        method: 'backup-code',
        error: errorMessage
      };
    }
  }, [twoFactorService, handleError]);

  // 백업 코드 재생성
  const regenerateBackupCodes = useCallback(async (userId: string): Promise<BackupCode[]> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const newCodes = await twoFactorService.regenerateBackupCodes(userId);
      
      return newCodes;
    } catch (error) {
      handleError(error, '백업 코드 재생성 실패');
      return [];
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [twoFactorService, handleError]);

  // 복구 시작
  const initiateRecovery = useCallback(async (
    userId: string, 
    method: 'email' | 'phone'
  ): Promise<string> => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const requestId = await twoFactorService.initiateRecovery(userId, method);
      return requestId;
    } catch (error) {
      handleError(error, '복구 시작 실패');
      throw error;
    }
  }, [twoFactorService, handleError]);

  // 복구 검증
  const verifyRecovery = useCallback(async (
    requestId: string, 
    code: string
  ): Promise<VerificationResult> => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const result = await twoFactorService.verifyRecovery(requestId, code);
      
      return result;
    } catch (error) {
      const errorMessage = '복구 검증 실패';
      handleError(error, errorMessage);
      
      return {
        isValid: false,
        method: 'recovery',
        error: errorMessage
      };
    }
  }, [twoFactorService, handleError]);

  // 세션 로드
  const loadSession = useCallback(async (userId: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const session = await twoFactorService.getSession(userId);
      dispatch({ type: 'SET_SESSION', payload: session });
      
      if (!state.isInitialized) {
        dispatch({ type: 'SET_INITIALIZED', payload: true });
      }
    } catch (error) {
      handleError(error, '세션 로드 실패');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [twoFactorService, handleError, state.isInitialized]);

  // 세션 리셋
  const resetSession = useCallback(async (userId: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      
      await twoFactorService.resetSession(userId);
      
      // 세션 새로고침
      await loadSession(userId);
    } catch (error) {
      handleError(error, '세션 리셋 실패');
    }
  }, [twoFactorService, handleError, loadSession]);

  // 에러 클리어
  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  // 편의 속성들
  const isEnabled = state.session?.isEnabled ?? false;
  const isVerified = !!state.session?.lastVerified;
  const isLocked = state.session?.lockedUntil 
    ? state.session.lockedUntil > new Date() 
    : false;

  const contextValue: TwoFactorContextType = {
    state,
    isEnabled,
    isVerified,
    isLocked,
    initializeSetup,
    setupTwoFactor,
    disableTwoFactor,
    verifyTotp,
    verifyBackupCode,
    regenerateBackupCodes,
    initiateRecovery,
    verifyRecovery,
    loadSession,
    resetSession,
    clearError
  };

  return (
    <TwoFactorContext.Provider value={contextValue}>
      {children}
    </TwoFactorContext.Provider>
  );
};

// 훅
export const useTwoFactorContext = (): TwoFactorContextType => {
  const context = useContext(TwoFactorContext);
  
  if (!context) {
    throw new Error('useTwoFactorContext must be used within a TwoFactorProvider');
  }
  
  return context;
};