/**
 * @repo/permissions - 권한 게이트
 * Higher-order component for permission-based access control
 */

import React, { ComponentType, ReactNode } from 'react';
import { usePermission } from '../hooks/usePermission';
import { PermissionAction, PermissionContext } from '../types';

export interface PermissionGateProps {
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

export interface WithPermissionProps {
  permissionProps?: PermissionGateProps;
}

export function PermissionGate({
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
}: PermissionGateProps & { children: ReactNode }) {
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

/**
 * HOC for adding permission checking to components
 */
export function withPermissions<P extends object>(
  Component: ComponentType<P>,
  defaultPermissionProps?: PermissionGateProps
) {
  return function PermissionWrappedComponent(
    props: P & WithPermissionProps
  ) {
    const { permissionProps, ...componentProps } = props;
    const finalPermissionProps = {
      ...defaultPermissionProps,
      ...permissionProps
    };

    return (
      <PermissionGate {...finalPermissionProps}>
        <Component {...(componentProps as P)} />
      </PermissionGate>
    );
  };
}

/**
 * Hook for conditional rendering based on permissions
 */
export function usePermissionGate(gateProps: PermissionGateProps) {
  const {
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    checkPermission
  } = usePermission();

  const {
    permission,
    role,
    permissions,
    requireAll = true,
    resource,
    action,
    context
  } = gateProps;

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

  return {
    hasAccess: checkAccess(),
    checkAccess
  };
}