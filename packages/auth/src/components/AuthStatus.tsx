/**
 * @company/auth - Auth Status Component
 * Display authentication status information
 */

import React from 'react';
import { AuthStatus as Status } from '../types';
import { useAuth, useAuthUser, useAuthStatus } from '../hooks/useAuth';

interface AuthStatusProps {
  showUserInfo?: boolean;
  showSessionInfo?: boolean;
  className?: string;
}

export function AuthStatus({ 
  showUserInfo = true, 
  showSessionInfo = false,
  className = '' 
}: AuthStatusProps) {
  const { session, checkSession } = useAuth();
  const user = useAuthUser();
  const status = useAuthStatus();

  const getStatusColor = (status: Status) => {
    switch (status) {
      case Status.AUTHENTICATED:
        return '#28a745';
      case Status.UNAUTHENTICATED:
        return '#6c757d';
      case Status.LOADING:
        return '#007bff';
      case Status.ERROR:
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const getStatusText = (status: Status) => {
    switch (status) {
      case Status.AUTHENTICATED:
        return '인증됨';
      case Status.UNAUTHENTICATED:
        return '미인증';
      case Status.LOADING:
        return '로딩 중';
      case Status.ERROR:
        return '오류';
      default:
        return '알 수 없음';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  const getTimeUntilExpiry = () => {
    if (!session) return null;
    
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);
    const diffMs = expiresAt.getTime() - now.getTime();
    
    if (diffMs <= 0) return '만료됨';
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays}일 ${diffHours % 24}시간 남음`;
    } else if (diffHours > 0) {
      return `${diffHours}시간 ${diffMinutes % 60}분 남음`;
    } else {
      return `${diffMinutes}분 남음`;
    }
  };

  return (
    <div className={`auth-status ${className}`}>
      <div className="auth-status__indicator">
        <span 
          className="auth-status__dot"
          style={{ backgroundColor: getStatusColor(status) }}
        />
        <span className="auth-status__text">
          {getStatusText(status)}
        </span>
      </div>

      {showUserInfo && user && (
        <div className="auth-status__user">
          <div className="auth-status__user-info">
            <span className="auth-status__user-name">{user.name}</span>
            <span className="auth-status__user-email">{user.email}</span>
          </div>
          {user.avatar && (
            <img 
              src={user.avatar} 
              alt={`${user.name}의 프로필`}
              className="auth-status__user-avatar"
            />
          )}
        </div>
      )}

      {showSessionInfo && session && (
        <div className="auth-status__session">
          <div className="auth-status__session-info">
            <div>로그인: {formatDate(new Date(session.issuedAt))}</div>
            <div>만료: {formatDate(new Date(session.expiresAt))}</div>
            <div>남은 시간: {getTimeUntilExpiry()}</div>
          </div>
          <button 
            onClick={checkSession}
            className="auth-status__refresh-button"
          >
            세션 확인
          </button>
        </div>
      )}
    </div>
  );
}

// 간단한 스타일링을 위한 CSS-in-JS (선택사항)
const styles = `
  .auth-status {
    padding: 12px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background: #f8f9fa;
    font-size: 14px;
  }

  .auth-status__indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .auth-status__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .auth-status__text {
    font-weight: 500;
  }

  .auth-status__user {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 0;
    border-top: 1px solid #e0e0e0;
  }

  .auth-status__user-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .auth-status__user-name {
    font-weight: 500;
    color: #333;
  }

  .auth-status__user-email {
    color: #666;
    font-size: 12px;
  }

  .auth-status__user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
  }

  .auth-status__session {
    padding: 8px 0;
    border-top: 1px solid #e0e0e0;
  }

  .auth-status__session-info {
    margin-bottom: 8px;
  }

  .auth-status__session-info > div {
    margin-bottom: 4px;
    color: #666;
    font-size: 12px;
  }

  .auth-status__refresh-button {
    padding: 4px 8px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
  }

  .auth-status__refresh-button:hover {
    background: #0056b3;
  }
`;

// 스타일 주입 (개발 환경에서만)
if (typeof document !== 'undefined' && !document.getElementById('auth-status-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'auth-status-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}