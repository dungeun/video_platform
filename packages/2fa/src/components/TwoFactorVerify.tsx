/**
 * 2FA 검증 컴포넌트
 */

import React, { useState } from 'react';
import { VerificationResult } from '../types';

export interface TwoFactorVerifyProps {
  onVerify: (method: 'totp' | 'backup-code', value: string) => Promise<VerificationResult>;
  onCancel?: () => void;
  allowBackupCodes?: boolean;
  title?: string;
  subtitle?: string;
  className?: string;
}

export const TwoFactorVerify: React.FC<TwoFactorVerifyProps> = ({
  onVerify,
  onCancel,
  allowBackupCodes = true,
  title = '2단계 인증',
  subtitle = '인증 앱에서 생성된 6자리 코드를 입력하세요',
  className = ''
}) => {
  const [method, setMethod] = useState<'totp' | 'backup-code'>('totp');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) return;

    try {
      setIsLoading(true);
      setError('');

      const result = await onVerify(method, code);

      if (!result.isValid) {
        setError(result.error || '인증에 실패했습니다.');
        setRemainingAttempts(result.remainingAttempts || null);
        
        // 계정이 잠긴 경우
        if (result.lockoutUntil) {
          const lockoutTime = new Date(result.lockoutUntil).toLocaleTimeString();
          setError(`너무 많은 시도로 인해 계정이 잠겼습니다. ${lockoutTime}까지 기다려 주세요.`);
        }
      } else {
        // 성공 시 부모 컴포넌트에서 처리
        setCode('');
      }
    } catch (err) {
      setError('인증 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (value: string) => {
    if (method === 'totp') {
      // TOTP는 숫자만 6자리
      const numericValue = value.replace(/\D/g, '').slice(0, 6);
      setCode(numericValue);
    } else {
      // 백업 코드는 영숫자와 하이픈 허용
      const cleanValue = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
      setCode(cleanValue);
    }
  };

  const isCodeValid = () => {
    if (method === 'totp') {
      return code.length === 6;
    } else {
      return code.length >= 8; // 백업 코드 최소 길이
    }
  };

  return (
    <div className={`max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg ${className}`}>
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold mb-2">{title}</h2>
        <p className="text-gray-600 text-sm">{subtitle}</p>
      </div>

      {allowBackupCodes && (
        <div className="mb-4">
          <div className="flex rounded-md border border-gray-300">
            <button
              type="button"
              onClick={() => setMethod('totp')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-md transition-colors ${
                method === 'totp' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              인증 앱
            </button>
            <button
              type="button"
              onClick={() => setMethod('backup-code')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-md transition-colors ${
                method === 'backup-code' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              백업 코드
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            {method === 'totp' ? '인증 코드' : '백업 코드'}
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            placeholder={method === 'totp' ? '000000' : 'XXXX-XXXX'}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              method === 'totp' ? 'text-center text-2xl tracking-widest' : 'text-center text-lg'
            }`}
            maxLength={method === 'totp' ? 6 : 20}
            autoComplete="off"
          />
          {method === 'totp' && (
            <p className="text-xs text-gray-500 mt-1">
              인증 앱에서 생성된 6자리 숫자를 입력하세요
            </p>
          )}
          {method === 'backup-code' && (
            <p className="text-xs text-gray-500 mt-1">
              저장해둔 백업 코드 중 하나를 입력하세요
            </p>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
            {remainingAttempts !== null && remainingAttempts > 0 && (
              <p className="text-xs text-red-600 mt-1">
                {remainingAttempts}번의 시도가 남았습니다.
              </p>
            )}
          </div>
        )}

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={!isCodeValid() || isLoading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '확인 중...' : '확인'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
          )}
        </div>
      </form>

      {method === 'totp' && allowBackupCodes && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setMethod('backup-code')}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            인증 앱을 사용할 수 없나요? 백업 코드를 사용하세요
          </button>
        </div>
      )}
    </div>
  );
};