import React, { useState, useEffect } from 'react';
import { Result } from '@repo/core';
import { totpManager } from '../utils/TotpManager';

export interface TwoFactorVerifyProps {
  secret: string;
  backupCodes?: string[];
  onVerifySuccess: (usedBackupCode?: string) => void;
  onVerifyFailure: (error: string) => void;
  onCancel?: () => void;
  className?: string;
  maxAttempts?: number;
}

interface VerifyState {
  method: 'totp' | 'backup';
  code: string;
  attempts: number;
  isLoading: boolean;
  error: string | null;
  timeRemaining: number;
}

export const TwoFactorVerify: React.FC<TwoFactorVerifyProps> = ({
  secret,
  backupCodes = [],
  onVerifySuccess,
  onVerifyFailure,
  onCancel,
  className = '',
  maxAttempts = 3
}) => {
  const [state, setState] = useState<VerifyState>({
    method: 'totp',
    code: '',
    attempts: 0,
    isLoading: false,
    error: null,
    timeRemaining: 30
  });

  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = 30 - (now % 30);
      setState(prev => ({ ...prev, timeRemaining: remaining }));
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleVerify = async () => {
    if (!state.code.trim()) {
      setState(prev => ({ ...prev, error: '코드를 입력해주세요.' }));
      return;
    }

    if (state.attempts >= maxAttempts) {
      onVerifyFailure('최대 시도 횟수를 초과했습니다.');
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      if (state.method === 'totp') {
        await handleTotpVerify();
      } else {
        await handleBackupCodeVerify();
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: '인증 중 오류가 발생했습니다.',
        attempts: prev.attempts + 1
      }));
    }
  };

  const handleTotpVerify = async () => {
    const result = totpManager.verifyToken(secret, state.code);
    
    if (result.isSuccess && result.data.isValid) {
      setState(prev => ({ ...prev, isLoading: false }));
      onVerifySuccess();
    } else {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: '인증 코드가 올바르지 않습니다.',
        attempts: prev.attempts + 1,
        code: ''
      }));
    }
  };

  const handleBackupCodeVerify = async () => {
    const result = totpManager.verifyBackupCode(backupCodes, state.code);
    
    if (result.isSuccess && result.data.isValid) {
      setState(prev => ({ ...prev, isLoading: false }));
      onVerifySuccess(state.code);
    } else {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: '백업 코드가 올바르지 않습니다.',
        attempts: prev.attempts + 1,
        code: ''
      }));
    }
  };

  const handleCodeChange = (value: string) => {
    if (state.method === 'totp') {
      // TOTP: 숫자만, 최대 6자리
      const numericValue = value.replace(/\D/g, '').slice(0, 6);
      setState(prev => ({ ...prev, code: numericValue, error: null }));
    } else {
      // 백업 코드: 영숫자와 하이픈, 최대 9자리 (XXXX-XXXX 형식)
      const formattedValue = value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 9);
      setState(prev => ({ ...prev, code: formattedValue, error: null }));
    }
  };

  const switchMethod = (method: 'totp' | 'backup') => {
    setState(prev => ({
      ...prev,
      method,
      code: '',
      error: null
    }));
  };

  const getProgressBarWidth = () => {
    return (state.timeRemaining / 30) * 100;
  };

  const isCodeValid = () => {
    if (state.method === 'totp') {
      return state.code.length === 6;
    } else {
      return state.code.length >= 8; // 백업 코드 최소 길이
    }
  };

  const remainingAttempts = maxAttempts - state.attempts;

  return (
    <div className={`max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold mb-2">2차 인증</h2>
        <p className="text-gray-600">
          {state.method === 'totp' 
            ? '인증 앱에서 6자리 코드를 입력하세요'
            : '백업 코드를 입력하세요'
          }
        </p>
      </div>

      {/* 메소드 선택 탭 */}
      <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => switchMethod('totp')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            state.method === 'totp'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          인증 앱
        </button>
        <button
          onClick={() => switchMethod('backup')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            state.method === 'backup'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
          disabled={backupCodes.length === 0}
        >
          백업 코드
        </button>
      </div>

      {/* TOTP 타이머 */}
      {state.method === 'totp' && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>코드 유효 시간</span>
            <span>{state.timeRemaining}초</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-1000 ${
                state.timeRemaining <= 10 ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{ width: `${getProgressBarWidth()}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* 코드 입력 */}
      <div className="mb-4">
        <label htmlFor="verifyCode" className="block text-sm font-medium mb-2">
          {state.method === 'totp' ? '인증 코드' : '백업 코드'}
        </label>
        <input
          id="verifyCode"
          type="text"
          value={state.code}
          onChange={(e) => handleCodeChange(e.target.value)}
          placeholder={state.method === 'totp' ? '123456' : 'XXXX-XXXX'}
          className="w-full px-3 py-3 text-center text-lg font-mono border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoComplete="off"
          autoFocus
        />
      </div>

      {/* 에러 메시지 */}
      {state.error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {state.error}
          {remainingAttempts > 0 && (
            <div className="mt-1">
              남은 시도 횟수: {remainingAttempts}회
            </div>
          )}
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="space-y-3">
        <button
          onClick={handleVerify}
          disabled={state.isLoading || !isCodeValid() || remainingAttempts <= 0}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {state.isLoading ? '확인 중...' : '확인'}
        </button>

        {onCancel && (
          <button
            onClick={onCancel}
            className="w-full text-gray-600 border border-gray-300 py-2 px-4 rounded-md hover:bg-gray-50"
          >
            취소
          </button>
        )}
      </div>

      {/* 도움말 */}
      <div className="mt-4 text-center">
        {state.method === 'totp' ? (
          <div className="text-sm text-gray-500">
            <p>인증 앱에 접근할 수 없나요?</p>
            <button
              onClick={() => switchMethod('backup')}
              className="text-blue-600 hover:underline"
              disabled={backupCodes.length === 0}
            >
              백업 코드 사용하기
            </button>
          </div>
        ) : (
          <div className="text-sm text-gray-500">
            <p>백업 코드는 한 번만 사용할 수 있습니다.</p>
            <button
              onClick={() => switchMethod('totp')}
              className="text-blue-600 hover:underline"
            >
              인증 앱으로 돌아가기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};