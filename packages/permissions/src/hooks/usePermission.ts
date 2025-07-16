/**
 * @company/permissions - usePermission 훅
 * React hook for permission checking
 */

import { useCallback, useContext } from 'react';
import {
  UsePermissionReturn,
  PermissionAction,
  PermissionContext,
  PermissionEvaluationOptions,
  PermissionEvaluationResult,
  PermissionSummary
} from '../types';
import { PermissionContext as PermissionProviderContext } from '../providers/PermissionProvider';

export function usePermission(): UsePermissionReturn {
  const context = useContext(PermissionProviderContext);

  if (!context) {
    throw new Error('usePermission must be used within a PermissionProvider');
  }

  const {
    permissionManager,
    currentUserId,
    isLoading,
    error
  } = context;

  const hasPermission = useCallback((
    permission: string,
    context?: PermissionContext
  ): boolean => {
    if (!currentUserId || !permissionManager) {
      return false;
    }

    return permissionManager.hasPermission(currentUserId, permission, context);
  }, [permissionManager, currentUserId]);

  const hasRole = useCallback((role: string): boolean => {
    if (!currentUserId || !permissionManager) {
      return false;
    }

    return permissionManager.hasRole(currentUserId, role);
  }, [permissionManager, currentUserId]);

  const hasAnyPermission = useCallback((
    permissions: string[],
    context?: PermissionContext
  ): boolean => {
    if (!currentUserId || !permissionManager) {
      return false;
    }

    return permissionManager.hasAnyPermission(currentUserId, permissions, context);
  }, [permissionManager, currentUserId]);

  const hasAllPermissions = useCallback((
    permissions: string[],
    context?: PermissionContext
  ): boolean => {
    if (!currentUserId || !permissionManager) {
      return false;
    }

    return permissionManager.hasAllPermissions(currentUserId, permissions, context);
  }, [permissionManager, currentUserId]);

  const checkPermission = useCallback((
    resource: string,
    action: PermissionAction,
    context?: PermissionContext
  ): boolean => {
    if (!currentUserId || !permissionManager) {
      return false;
    }

    return permissionManager.checkPermission(currentUserId, resource, action, context);
  }, [permissionManager, currentUserId]);

  const evaluatePermission = useCallback((
    permission: string,
    context?: PermissionContext,
    options?: PermissionEvaluationOptions
  ): PermissionEvaluationResult => {
    if (!currentUserId || !permissionManager) {
      return {
        granted: false,
        reason: '사용자 또는 권한 관리자가 없습니다'
      };
    }

    return permissionManager.evaluatePermission(currentUserId, permission, context, options);
  }, [permissionManager, currentUserId]);

  const getPermissionSummary = useCallback((): PermissionSummary | null => {
    if (!currentUserId || !permissionManager) {
      return null;
    }

    return permissionManager.getPermissionSummary(currentUserId);
  }, [permissionManager, currentUserId]);

  return {
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    checkPermission,
    evaluatePermission,
    getPermissionSummary,
    isLoading,
    error
  };
}