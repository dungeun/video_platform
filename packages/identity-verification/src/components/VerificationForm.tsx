import React, { useState, useCallback } from 'react';
import { VerificationMethod, VerificationRequest, MobileCarrier } from '../types';
import { validateForm } from '../utils/validators';
import { formatPhoneNumber, formatBirthDate } from '../utils/formatters';

interface VerificationFormProps {
  /** 선택된 인증 수단 */
  method: VerificationMethod;
  /** 폼 데이터 */
  data: Partial<VerificationRequest>;
  /** 데이터 변경 콜백 */
  onChange: (data: Partial<VerificationRequest>) => void;
  /** 제출 콜백 */
  onSubmit: () => void;
  /** 뒤로가기 콜백 */
  onBack?: () => void;
  /** 취소 콜백 */
  onCancel?: () => void;
}

/**
 * 본인인증 정보 입력 폼
 */
export const VerificationForm: React.FC<VerificationFormProps> = ({
  method,
  data,
  onChange,
  onSubmit,
  onBack,
  onCancel
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  /**
   * 입력 필드 변경 처리
   */
  const handleChange = useCallback((field: string, value: any) => {
    onChange({ [field]: value });
    
    // 터치된 필드 표시
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // 에러 초기화
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [onChange, errors]);

  /**
   * 휴대폰 번호 변경 처리
   */
  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    handleChange('phoneNumber', formatted);
  }, [handleChange]);

  /**
   * 생년월일 변경 처리
   */
  const handleBirthDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatBirthDate(e.target.value);
    handleChange('birthDate', formatted);
  }, [handleChange]);

  /**
   * 폼 제출 처리
   */
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    // 폼 검증
    const validationErrors = validateForm(data as VerificationRequest);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // 모든 필드를 터치된 것으로 표시
      const allTouched = Object.keys(data).reduce((acc, key) => ({
        ...acc,
        [key]: true
      }), {});
      setTouched(allTouched);
      return;
    }
    
    onSubmit();
  }, [data, onSubmit]);

  return (
    <form onSubmit={handleSubmit} className="verification-form space-y-4">
      {/* 이름 입력 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          이름 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={data.name || ''}
          onChange={(e) => handleChange('name', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            touched.name && errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="홍길동"
        />
        {touched.name && errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name}</p>
        )}
      </div>

      {/* 생년월일 입력 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          생년월일 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={data.birthDate || ''}
          onChange={handleBirthDateChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            touched.birthDate && errors.birthDate ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="YYYYMMDD"
          maxLength={8}
        />
        {touched.birthDate && errors.birthDate && (
          <p className="mt-1 text-sm text-red-500">{errors.birthDate}</p>
        )}
      </div>

      {/* 성별 선택 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          성별
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="gender"
              value="M"
              checked={data.gender === 'M'}
              onChange={() => handleChange('gender', 'M')}
              className="mr-2"
            />
            남성
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="gender"
              value="F"
              checked={data.gender === 'F'}
              onChange={() => handleChange('gender', 'F')}
              className="mr-2"
            />
            여성
          </label>
        </div>
      </div>

      {/* 휴대폰 번호 입력 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          휴대폰 번호 <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          value={data.phoneNumber || ''}
          onChange={handlePhoneChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            touched.phoneNumber && errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="010-1234-5678"
          maxLength={13}
        />
        {touched.phoneNumber && errors.phoneNumber && (
          <p className="mt-1 text-sm text-red-500">{errors.phoneNumber}</p>
        )}
      </div>

      {/* 통신사 선택 (휴대폰 인증인 경우) */}
      {method === VerificationMethod.MOBILE_CARRIER && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            통신사 <span className="text-red-500">*</span>
          </label>
          <select
            value={data.carrier || ''}
            onChange={(e) => handleChange('carrier', e.target.value as MobileCarrier)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              touched.carrier && errors.carrier ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">선택하세요</option>
            <option value={MobileCarrier.SKT}>SKT</option>
            <option value={MobileCarrier.KT}>KT</option>
            <option value={MobileCarrier.LGU}>LG U+</option>
            <option value={MobileCarrier.MVNO}>알뜰폰</option>
          </select>
          {touched.carrier && errors.carrier && (
            <p className="mt-1 text-sm text-red-500">{errors.carrier}</p>
          )}
        </div>
      )}

      {/* 내/외국인 선택 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          내/외국인
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="nationality"
              value="korean"
              checked={data.nationality === 'korean'}
              onChange={() => handleChange('nationality', 'korean')}
              className="mr-2"
            />
            내국인
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="nationality"
              value="foreigner"
              checked={data.nationality === 'foreigner'}
              onChange={() => handleChange('nationality', 'foreigner')}
              className="mr-2"
            />
            외국인
          </label>
        </div>
      </div>

      {/* 약관 동의 */}
      <div className="bg-gray-50 p-4 rounded-md">
        <p className="text-sm text-gray-600">
          본인인증을 진행하면 개인정보 수집 및 이용에 동의하는 것으로 간주됩니다.
        </p>
      </div>

      {/* 버튼 그룹 */}
      <div className="flex space-x-3 pt-4">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            이전
          </button>
        )}
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          인증하기
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            취소
          </button>
        )}
      </div>
    </form>
  );
};