/**
 * @repo/permissions - usePermissionCache 훅
 * React hook for permission cache management
 */

import { useCallback, useContext } from 'react';
import { UsePermissionCacheReturn, CacheInfo } from '../types';
import { PermissionContext as PermissionProviderContext } from '../providers/PermissionProvider';

export function usePermissionCache(): UsePermissionCacheReturn {
  const context = useContext(PermissionProviderContext);

  if (!context) {
    throw new Error('usePermissionCache must be used within a PermissionProvider');
  }

  const { permissionManager, currentUserId } = context;

  const clearCache = useCallback((): void => {
    if (!permissionManager) {
      return;
    }

    if (currentUserId) {
      permissionManager.clearUserCache(currentUserId);
    } else {
      permissionManager.clearCache();
    }
  }, [permissionManager, currentUserId]);

  const getCacheStats = useCallback((): CacheInfo => {
    if (!permissionManager) {
      return {
        size: 0,
        hitRate: 0,
        lastCleared: new Date(),
        entries: 0
      };
    }

    return permissionManager.getCacheInfo();
  }, [permissionManager]);

  const warmupCache = useCallback(async (permissions: string[]): Promise<void> => {
    if (!permissionManager || !currentUserId) {
      return;
    }

    // 권한들을 미리 평가하여 캐시에 저장
    await Promise.all(
      permissions.map(permission =>
        permissionManager.evaluatePermission(currentUserId, permission, undefined, {
          useCache: false // 강제로 평가하여 캐시에 저장
        })
      )
    );
  }, [permissionManager, currentUserId]);

  const preloadPermissions = useCallback(async (userId: string): Promise<void> => {
    if (!permissionManager) {
      return;
    }

    await permissionManager.loadUserPermissions(userId);
  }, [permissionManager]);

  return {
    clearCache,
    getCacheStats,
    warmupCache,
    preloadPermissions
  };
}