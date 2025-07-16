/**
 * @repo/auth-core - 로그인 폼 컴포넌트
 * 재사용 가능한 로그인 폼
 */

import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { LoginCredentials } from '../types';

interface LoginFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  showRememberMe?: boolean;
  className?: string;
  disabled?: boolean;
}

export function LoginForm({
  onSuccess,
  onError,
  showRememberMe = true,
  className = '',
  disabled = false
}: LoginFormProps) {
  const { login, isLoading, error } = useAuth();
  
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: '',
    rememberMe: false
  });

  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // 입력 시 해당 필드의 검증 에러 제거
    if (validationErrors[name as keyof typeof validationErrors]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {};

    if (!formData.email) {
      errors.email = '이메일을 입력해주세요';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = '올바른 이메일 형식이 아닙니다';
    }

    if (!formData.password) {
      errors.password = '비밀번호를 입력해주세요';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || disabled || isLoading) {
      return;
    }

    try {
      const result = await login(formData);
      
      if (result.success) {
        onSuccess?.();
      } else {
        const errorMessage = result.error || '로그인에 실패했습니다';
        onError?.(errorMessage);
      }
    } catch (err) {
      const errorMessage = '로그인 중 오류가 발생했습니다';
      onError?.(errorMessage);
    }
  };

  const displayError = error || (validationErrors.email || validationErrors.password);

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      {/* 이메일 입력 */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          이메일
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          disabled={disabled || isLoading}
          className={`
            w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-50 disabled:text-gray-500
            ${validationErrors.email ? 'border-red-300' : 'border-gray-300'}
          `}
          placeholder="이메일을 입력하세요"
          autoComplete="email"
        />
        {validationErrors.email && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
        )}
      </div>

      {/* 비밀번호 입력 */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          비밀번호
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          disabled={disabled || isLoading}
          className={`
            w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-50 disabled:text-gray-500
            ${validationErrors.password ? 'border-red-300' : 'border-gray-300'}
          `}
          placeholder="비밀번호를 입력하세요"
          autoComplete="current-password"
        />
        {validationErrors.password && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
        )}
      </div>

      {/* 로그인 유지 */}
      {showRememberMe && (
        <div className="flex items-center">
          <input
            type="checkbox"
            id="rememberMe"
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={handleInputChange}
            disabled={disabled || isLoading}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
            로그인 상태 유지
          </label>
        </div>
      )}

      {/* 에러 메시지 */}
      {displayError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{displayError}</p>
        </div>
      )}

      {/* 로그인 버튼 */}
      <button
        type="submit"
        disabled={disabled || isLoading}
        className={`
          w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
          ${disabled || isLoading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          }
          transition-colors duration-200
        `}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            로그인 중...
          </>
        ) : (
          '로그인'
        )}
      </button>
    </form>
  );
}