import React, { useState, useEffect } from 'react';
import { Result } from '@repo/core';
import { totpManager, TotpSecret } from '../utils/TotpManager';

export interface TwoFactorSetupProps {
  userEmail: string;
  onSetupComplete: (secret: string, backupCodes: string[]) => void;
  onCancel: () => void;
  className?: string;
}

interface SetupStep {
  step: 'generate' | 'verify' | 'backup' | 'complete';
  data?: TotpSecret;
  verificationCode?: string;
}

export const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({
  userEmail,
  onSetupComplete,
  onCancel,
  className = ''
}) => {
  const [setupState, setSetupState] = useState<SetupStep>({ step: 'generate' });
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateSecret();
  }, [userEmail]);

  const generateSecret = async () => {
    setIsLoading(true);
    setError(null);

    const result = totpManager.generateSecret(userEmail);
    if (result.isSuccess) {
      setSetupState({ step: 'verify', data: result.data });
    } else {
      setError('2FA 설정을 생성하는데 실패했습니다.');
    }
    setIsLoading(false);
  };

  const verifyCode = async () => {
    if (!setupState.data || !verificationCode) {
      setError('인증 코드를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = totpManager.verifyToken(setupState.data.secret, verificationCode);
    if (result.isSuccess && result.data.isValid) {
      setSetupState({ ...setupState, step: 'backup' });
    } else {
      setError('인증 코드가 올바르지 않습니다.');
    }
    setIsLoading(false);
  };

  const completeSetup = () => {
    if (setupState.data) {
      onSetupComplete(setupState.data.secret, setupState.data.backupCodes);
      setSetupState({ ...setupState, step: 'complete' });
    }
  };

  const downloadBackupCodes = () => {
    if (!setupState.data) return;

    const codesText = setupState.data.backupCodes.join('\n');
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderStep = () => {
    switch (setupState.step) {
      case 'generate':
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>2FA 설정을 생성하고 있습니다...</p>
          </div>
        );

      case 'verify':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">QR 코드를 스캔하세요</h3>
              <p className="text-gray-600 mb-4">
                Google Authenticator나 Authy 같은 앱으로 아래 QR 코드를 스캔하세요.
              </p>
              
              <div className="bg-white p-4 rounded-lg border inline-block">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupState.data?.qrCode || '')}`}
                  alt="2FA QR Code"
                  className="w-48 h-48"
                />
              </div>
              
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-500">
                  수동으로 입력하기
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded text-sm font-mono break-all">
                  {setupState.data?.secret}
                </div>
              </details>
            </div>

            <div>
              <label htmlFor="verificationCode" className="block text-sm font-medium mb-2">
                인증 코드 입력
              </label>
              <input
                id="verificationCode"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6자리 코드"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={6}
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={verifyCode}
                disabled={isLoading || verificationCode.length !== 6}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '확인 중...' : '확인'}
              </button>
              <button
                onClick={onCancel}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                취소
              </button>
            </div>
          </div>
        );

      case 'backup':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">백업 코드 저장</h3>
              <p className="text-gray-600 mb-4">
                휴대폰을 분실했을 때 사용할 수 있는 백업 코드입니다. 안전한 곳에 보관하세요.
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex">
                  <div className="text-yellow-600 mr-3">⚠️</div>
                  <div>
                    <h4 className="font-medium text-yellow-800">중요!</h4>
                    <p className="text-sm text-yellow-700">
                      각 백업 코드는 한 번만 사용할 수 있습니다. 안전한 곳에 저장하세요.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-100 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                  {setupState.data?.backupCodes.map((code, index) => (
                    <div key={index} className="p-2 bg-white rounded border">
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={downloadBackupCodes}
                className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
              >
                다운로드
              </button>
              <button
                onClick={completeSetup}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
              >
                설정 완료
              </button>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center space-y-4">
            <div className="text-green-600 text-4xl">✓</div>
            <h3 className="text-lg font-semibold">2FA 설정 완료!</h3>
            <p className="text-gray-600">
              이제 로그인할 때 2차 인증이 필요합니다.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-center">2차 인증 설정</h2>
        <div className="mt-4 flex justify-center">
          <div className="flex space-x-2">
            {['generate', 'verify', 'backup', 'complete'].map((step, index) => (
              <div
                key={step}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  ['generate', 'verify', 'backup', 'complete'].indexOf(setupState.step) >= index
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index + 1}
              </div>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {renderStep()}
    </div>
  );
};