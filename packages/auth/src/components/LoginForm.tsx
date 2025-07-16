/**
 * @company/auth - Login Form Component
 * Pure login form for authentication
 */

import React, { useState } from 'react';
import { LoginCredentials } from '../types';
import { useAuth } from '../hooks/useAuth';

interface LoginFormProps {
  onLoginSuccess?: () => void;
  onLoginError?: (error: string) => void;
  className?: string;
  showRememberMe?: boolean;
}

export function LoginForm({ 
  onLoginSuccess, 
  onLoginError, 
  className = '',
  showRememberMe = true 
}: LoginFormProps) {
  const { login, isLoading, error } = useAuth();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
    rememberMe: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await login(credentials);
    
    if (result.success) {
      onLoginSuccess?.();
    } else {
      onLoginError?.(result.error || '로그인에 실패했습니다');
    }
  };

  const handleInputChange = (field: keyof LoginCredentials) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'rememberMe' ? e.target.checked : e.target.value;
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className={`auth-login-form ${className}`}>
      <div className="form-group">
        <label htmlFor="email">이메일</label>
        <input
          type="email"
          id="email"
          value={credentials.email}
          onChange={handleInputChange('email')}
          required
          disabled={isLoading}
          placeholder="이메일을 입력하세요"
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">비밀번호</label>
        <input
          type="password"
          id="password"
          value={credentials.password}
          onChange={handleInputChange('password')}
          required
          disabled={isLoading}
          placeholder="비밀번호를 입력하세요"
        />
      </div>

      {showRememberMe && (
        <div className="form-group checkbox-group">
          <input
            type="checkbox"
            id="rememberMe"
            checked={credentials.rememberMe || false}
            onChange={handleInputChange('rememberMe')}
            disabled={isLoading}
          />
          <label htmlFor="rememberMe">로그인 상태 유지</label>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <button 
        type="submit" 
        disabled={isLoading || !credentials.email || !credentials.password}
        className="login-button"
      >
        {isLoading ? '로그인 중...' : '로그인'}
      </button>
    </form>
  );
}

// 간단한 스타일링을 위한 CSS-in-JS (선택사항)
const styles = `
  .auth-login-form {
    max-width: 400px;
    margin: 0 auto;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: #fff;
  }

  .form-group {
    margin-bottom: 16px;
  }

  .form-group label {
    display: block;
    margin-bottom: 4px;
    font-weight: 500;
    color: #333;
  }

  .form-group input[type="email"],
  .form-group input[type="password"] {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
  }

  .form-group input[type="email"]:focus,
  .form-group input[type="password"]:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }

  .checkbox-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .checkbox-group input[type="checkbox"] {
    width: auto;
  }

  .error-message {
    color: #dc3545;
    font-size: 14px;
    margin-bottom: 16px;
    padding: 8px;
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: 4px;
  }

  .login-button {
    width: 100%;
    padding: 10px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .login-button:hover:not(:disabled) {
    background: #0056b3;
  }

  .login-button:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }
`;

// 스타일 주입 (개발 환경에서만)
if (typeof document !== 'undefined' && !document.getElementById('auth-login-form-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'auth-login-form-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}