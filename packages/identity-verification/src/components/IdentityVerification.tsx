import React, { useState, useCallback } from 'react';
import { VerificationMethodSelector } from './VerificationMethodSelector';
import { VerificationForm } from './VerificationForm';
import { VerificationStatus } from './VerificationStatus';
import { VerificationSuccess } from './VerificationSuccess';
import { VerificationError } from './VerificationError';
import { useVerification } from '../hooks/useVerification';
import {
  VerificationMethod,
  VerificationRequest,
  MobileCarrier,
  VerificationStatus as Status
} from '../types';

interface IdentityVerificationProps {
  /** 사용 가능한 인증 수단 */
  availableMethods?: VerificationMethod[];
  /** 인증 완료 콜백 */
  onSuccess?: (identity: any) => void;
  /** 인증 실패 콜백 */
  onError?: (error: any) => void;
  /** 인증 취소 콜백 */
  onCancel?: () => void;
  /** 커스텀 스타일 */
  className?: string;
}

/**
 * 본인인증 통합 컴포넌트
 */
export const IdentityVerification: React.FC<IdentityVerificationProps> = ({
  availableMethods = [
    VerificationMethod.PASS,
    VerificationMethod.MOBILE_CARRIER,
    VerificationMethod.KAKAO,
    VerificationMethod.NAVER
  ],
  onSuccess,
  onError,
  onCancel,
  className = ''
}) => {
  const [selectedMethod, setSelectedMethod] = useState<VerificationMethod | null>(null);
  const [formData, setFormData] = useState<Partial<VerificationRequest>>({
    name: '',
    birthDate: '',
    gender: undefined,
    phoneNumber: '',
    carrier: undefined,
    nationality: 'korean'
  });

  const {
    status,
    error,
    identity,
    startVerification,
    checkStatus,
    cancelVerification,
    reset
  } = useVerification();

  /**
   * 인증 수단 선택 처리
   */
  const handleMethodSelect = useCallback((method: VerificationMethod) => {
    setSelectedMethod(method);
  }, []);

  /**
   * 폼 데이터 변경 처리
   */
  const handleFormChange = useCallback((data: Partial<VerificationRequest>) => {
    setFormData(prev => ({ ...prev, ...data }));
  }, []);

  /**
   * 인증 시작 처리
   */
  const handleStartVerification = useCallback(async () => {
    if (!selectedMethod) return;

    const request: VerificationRequest = {
      method: selectedMethod,
      name: formData.name || '',
      birthDate: formData.birthDate || '',
      gender: formData.gender,
      phoneNumber: formData.phoneNumber || '',
      carrier: formData.carrier,
      nationality: formData.nationality || 'korean'
    };

    await startVerification(request);
  }, [selectedMethod, formData, startVerification]);

  /**
   * 재시도 처리
   */
  const handleRetry = useCallback(() => {
    reset();
    setSelectedMethod(null);
    setFormData({
      name: '',
      birthDate: '',
      gender: undefined,
      phoneNumber: '',
      carrier: undefined,
      nationality: 'korean'
    });
  }, [reset]);

  /**
   * 취소 처리
   */
  const handleCancel = useCallback(() => {
    if (status === Status.IN_PROGRESS || status === Status.VERIFYING) {
      cancelVerification();
    }
    onCancel?.();
  }, [status, cancelVerification, onCancel]);

  // 상태에 따른 화면 렌더링
  if (status === Status.SUCCESS && identity) {
    return (
      <VerificationSuccess
        identity={identity}
        onClose={() => {
          onSuccess?.(identity);
          handleRetry();
        }}
        className={className}
      />
    );
  }

  if (status === Status.FAILED && error) {
    return (
      <VerificationError
        error={error}
        onRetry={handleRetry}
        onCancel={handleCancel}
        className={className}
      />
    );
  }

  if (status === Status.IN_PROGRESS || status === Status.VERIFYING) {
    return (
      <VerificationStatus
        status={status}
        onCancel={handleCancel}
        className={className}
      />
    );
  }

  return (
    <div className={`identity-verification ${className}`}>
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">본인인증</h2>
        
        {!selectedMethod ? (
          <VerificationMethodSelector
            availableMethods={availableMethods}
            onSelect={handleMethodSelect}
            onCancel={onCancel}
          />
        ) : (
          <VerificationForm
            method={selectedMethod}
            data={formData}
            onChange={handleFormChange}
            onSubmit={handleStartVerification}
            onBack={() => setSelectedMethod(null)}
            onCancel={onCancel}
          />
        )}
      </div>
    </div>
  );
};