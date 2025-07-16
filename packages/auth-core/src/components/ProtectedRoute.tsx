/**
 * @repo/auth-core - 보호된 라우트 컴포넌트
 * 권한 기반 라우트 보호
 */

import React, { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { usePermission } from '../hooks/usePermission';
import { AuthStatus, PermissionAction } from '../types';

interface ProtectedRouteProps {
  children: ReactNode;
  
  // 인증 요구사항
  requireAuth?: boolean;
  
  // 권한 요구사항
  requiredPermissions?: string[];
  requiredRoles?: string[];
  requireAllPermissions?: boolean; // true: 모든 권한 필요, false: 하나만 필요
  
  // 리소스 기반 권한 (선택적)
  resource?: string;
  action?: PermissionAction;
  
  // 커스텀 권한 검증 함수
  customCheck?: () => boolean;
  
  // 컴포넌트들
  fallback?: ReactNode;
  unauthorizedComponent?: ReactNode;
  loadingComponent?: ReactNode;
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  requiredPermissions = [],
  requiredRoles = [],
  requireAllPermissions = true,
  resource,
  action,
  customCheck,
  fallback,
  unauthorizedComponent,
  loadingComponent
}: ProtectedRouteProps) {
  const { status, isAuthenticated, isLoading } = useAuth();
  const { 
    hasPermission, 
    hasRole, 
    hasAnyPermission, 
    hasAllPermissions, 
    checkPermission 
  } = usePermission();

  // 로딩 중
  if (isLoading || status === AuthStatus.LOADING) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 인증 필요하지만 인증되지 않음
  if (requireAuth && !isAuthenticated) {
    if (unauthorizedComponent) {
      return <>{unauthorizedComponent}</>;
    }
    
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            로그인이 필요합니다
          </h2>
          <p className="text-gray-600">
            이 페이지에 접근하려면 로그인해주세요.
          </p>
        </div>
      </div>
    );
  }

  // 인증은 되었지만 추가 권한 검증 필요
  if (isAuthenticated) {
    let hasRequiredAccess = true;

    // 역할 검증
    if (requiredRoles.length > 0) {
      hasRequiredAccess = requiredRoles.some(role => hasRole(role));
    }

    // 권한 검증
    if (hasRequiredAccess && requiredPermissions.length > 0) {
      if (requireAllPermissions) {
        hasRequiredAccess = hasAllPermissions(requiredPermissions);
      } else {
        hasRequiredAccess = hasAnyPermission(requiredPermissions);
      }
    }

    // 리소스 기반 권한 검증
    if (hasRequiredAccess && resource && action) {
      hasRequiredAccess = checkPermission(resource, action);
    }

    // 커스텀 권한 검증
    if (hasRequiredAccess && customCheck) {
      hasRequiredAccess = customCheck();
    }

    // 권한 부족
    if (!hasRequiredAccess) {
      if (unauthorizedComponent) {
        return <>{unauthorizedComponent}</>;
      }
      
      if (fallback) {
        return <>{fallback}</>;
      }
      
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              접근 권한이 없습니다
            </h2>
            <p className="text-gray-600">
              이 페이지에 접근할 권한이 없습니다.
            </p>
          </div>
        </div>
      );
    }
  }

  // 모든 검증 통과
  return <>{children}</>;
}

// HOC 버전
export function withProtectedRoute<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, 'children'>
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    );
  };
}