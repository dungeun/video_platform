/**
 * @repo/auth-core - usePermission 훅
 * 권한 확인을 위한 React 훅
 */

import { useCallback } from 'react';
import { UsePermissionReturn, PermissionAction } from '../types';
import { useAuth } from './useAuth';

export function usePermission(): UsePermissionReturn {
  const { hasPermission: authHasPermission, hasRole: authHasRole } = useAuth();

  const hasPermission = useCallback((permission: string): boolean => {
    return authHasPermission(permission);
  }, [authHasPermission]);

  const hasRole = useCallback((role: string): boolean => {
    return authHasRole(role);
  }, [authHasRole]);

  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  }, [hasPermission]);

  const checkPermission = useCallback((resource: string, action: PermissionAction): boolean => {
    const permissionName = `${resource}.${action}`;
    return hasPermission(permissionName);
  }, [hasPermission]);

  return {
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    checkPermission
  };
}