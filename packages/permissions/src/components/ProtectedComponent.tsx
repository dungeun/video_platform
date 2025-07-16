/**
 * @company/permissions - 보호된 컴포넌트
 * Component that conditionally renders based on permissions
 */

import React, { ReactNode } from 'react';
import { usePermission } from '../hooks/usePermission';
import { PermissionAction, PermissionContext } from '../types';

export interface ProtectedComponentProps {
  children: ReactNode;
  permission?: string;
  role?: string;
  permissions?: string[];
  requireAll?: boolean;
  resource?: string;
  action?: PermissionAction;
  context?: PermissionContext;
  fallback?: ReactNode;
  onUnauthorized?: () => void;
}

export function ProtectedComponent({
  children,
  permission,
  role,
  permissions,
  requireAll = true,
  resource,
  action,
  context,
  fallback = null,
  onUnauthorized
}: ProtectedComponentProps) {
  const {
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    checkPermission
  } = usePermission();

  const checkAccess = (): boolean => {
    // 역할 확인
    if (role && !hasRole(role)) {
      return false;
    }

    // 단일 권한 확인
    if (permission && !hasPermission(permission, context)) {
      return false;
    }

    // 리소스와 액션 확인
    if (resource && action && !checkPermission(resource, action, context)) {
      return false;
    }

    // 여러 권한 확인
    if (permissions && permissions.length > 0) {
      if (requireAll) {
        return hasAllPermissions(permissions, context);
      } else {
        return hasAnyPermission(permissions, context);
      }
    }

    return true;
  };

  const hasAccess = checkAccess();

  if (!hasAccess) {
    if (onUnauthorized) {
      onUnauthorized();
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}