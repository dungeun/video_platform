/**
 * 2FA 설정 컴포넌트
 */

import React, { useState, useEffect } from 'react';
import { TwoFactorSetupData, TotpSecret } from '../types';
import { TotpGenerator } from '../totp/TotpGenerator';
import { QrCodeGenerator } from '../totp/QrCodeGenerator';
import { BackupCodeGenerator } from '../backup/BackupCodeGenerator';

export interface TwoFactorSetupProps {
  userId: string;
  onSetupComplete: (setupData: TwoFactorSetupData) => void;
  onCancel: () => void;
  className?: string;
}

export const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({
  userId,
  onSetupComplete,
  onCancel,
  className = ''
}) => {
  const [step, setStep] = useState<'generate' | 'verify' | 'backup' | 'complete'>('generate');
  const [secret, setSecret] = useState<TotpSecret | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [verificationToken, setVerificationToken] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const totpGenerator = new TotpGenerator();
  const qrCodeGenerator = new QrCodeGenerator();
  const backupCodeGenerator = new BackupCodeGenerator();

  useEffect(() => {
    if (step === 'generate') {
      generateSecret();
    }
  }, [step]);

  const generateSecret = async () => {
    try {
      setIsLoading(true);
      setError('');

      // TOTP 시크릿 생성
      const newSecret = totpGenerator.generateSecret(userId);
      setSecret(newSecret);

      // QR 코드 생성
      const qrDataUrl = await qrCodeGenerator.generateDataUrl(newSecret.qrCodeUrl);
      setQrCodeDataUrl(qrDataUrl);

      setStep('verify');
    } catch (err) {
      setError('시크릿 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyToken = async () => {
    if (!secret || !verificationToken) return;

    try {
      setIsLoading(true);
      setError('');

      const isValid = totpGenerator.verifyToken(secret.secret, verificationToken);
      
      if (isValid) {
        // 백업 코드 생성
        const codeSet = backupCodeGenerator.generateCodeSet(userId);
        const codes = codeSet.codes.map(code => code.code);
        setBackupCodes(codes);
        setStep('backup');
      } else {
        setError('잘못된 인증 코드입니다. 다시 시도해 주세요.');
      }
    } catch (err) {
      setError('인증 코드 검증 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const completeSetup = () => {
    if (!secret) return;

    const setupData: TwoFactorSetupData = {
      secret,
      backupCodes: backupCodes.map((code, index) => ({
        id: `backup_${index}`,
        code,
        isUsed: false,
        createdAt: new Date()
      })),
      recoveryMethods: [],
      qrCodeDataUrl
    };

    onSetupComplete(setupData);
  };

  const renderStep = () => {
    switch (step) {
      case 'generate':
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>2FA 설정을 준비하고 있습니다...</p>
          </div>
        );

      case 'verify':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-4">
                인증 앱에서 QR 코드를 스캔하세요
              </h3>
              {qrCodeDataUrl && (
                <img 
                  src={qrCodeDataUrl} 
                  alt="QR Code" 
                  className="mx-auto mb-4 border rounded"
                />
              )}
              <p className="text-sm text-gray-600 mb-4">
                QR 코드를 스캔할 수 없는 경우, 다음 키를 수동으로 입력하세요:
              </p>
              <code className="block text-xs bg-gray-100 p-2 rounded font-mono">
                {secret?.manualEntryKey}
              </code>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                인증 앱에서 생성된 6자리 코드를 입력하세요
              </label>
              <input
                type="text"
                value={verificationToken}
                onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest"
                maxLength={6}
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={verifyToken}
                disabled={verificationToken.length !== 6 || isLoading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '확인 중...' : '확인'}
              </button>
              <button
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
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
              <h3 className="text-lg font-medium mb-4">백업 코드 저장</h3>
              <p className="text-sm text-gray-600 mb-4">
                휴대폰을 분실했을 때를 대비해 다음 백업 코드들을 안전한 곳에 저장하세요. 
                각 코드는 한 번만 사용할 수 있습니다.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="bg-white p-2 rounded border">
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  ⚠️ 백업 코드를 안전한 곳에 저장했는지 확인하세요. 
                  이 코드들은 다시 표시되지 않습니다.
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={completeSetup}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
              >
                설정 완료
              </button>
              <button
                onClick={() => setStep('verify')}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                이전
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg ${className}`}>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-center">2단계 인증 설정</h2>
        <div className="mt-4 flex justify-center">
          <div className="flex space-x-2">
            <div className={`w-2 h-2 rounded-full ${step === 'verify' || step === 'backup' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`w-2 h-2 rounded-full ${step === 'backup' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {renderStep()}
    </div>
  );
};