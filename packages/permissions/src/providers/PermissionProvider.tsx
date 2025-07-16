/**
 * @company/permissions - 권한 프로바이더
 * React context provider for permission management
 */

import React, { createContext, useEffect, useState, ReactNode } from 'react';
import { PermissionManager } from '../services/PermissionManager';
import { PermissionManagerConfig, PermissionEventType } from '../types';

export interface PermissionProviderProps {
  children: ReactNode;
  userId?: string;
  config?: Partial<PermissionManagerConfig>;
  onPermissionEvent?: (event: any) => void;
}

export interface PermissionContextValue {
  permissionManager: PermissionManager | null;
  currentUserId: string | null;
  isLoading: boolean;
  error: string | null;
  reloadPermissions: () => Promise<void>;
}

export const PermissionContext = createContext<PermissionContextValue | null>(null);

export function PermissionProvider({
  children,
  userId,
  config,
  onPermissionEvent
}: PermissionProviderProps) {
  const [permissionManager, setPermissionManager] = useState<PermissionManager | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(userId || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // PermissionManager 초기화
  useEffect(() => {
    const manager = new PermissionManager(config);
    
    // 이벤트 리스너 등록
    if (onPermissionEvent) {
      Object.values(PermissionEventType).forEach(eventType => {
        manager.addEventListener(eventType, onPermissionEvent);
      });
    }

    setPermissionManager(manager);

    return () => {
      // 정리 작업
      if (onPermissionEvent) {
        Object.values(PermissionEventType).forEach(eventType => {
          manager.removeEventListener(eventType, onPermissionEvent);
        });
      }
    };
  }, [config, onPermissionEvent]);

  // 사용자 변경 시 권한 로드
  useEffect(() => {
    if (userId !== currentUserId) {
      setCurrentUserId(userId || null);
    }
  }, [userId, currentUserId]);

  // 권한 로드
  useEffect(() => {
    if (!permissionManager || !currentUserId) {
      return;
    }

    loadUserPermissions();
  }, [permissionManager, currentUserId]);

  const loadUserPermissions = async () => {
    if (!permissionManager || !currentUserId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await permissionManager.loadUserPermissions(currentUserId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '권한 로드 실패';
      setError(errorMessage);
      console.error('권한 로드 실패:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const reloadPermissions = async () => {
    if (!permissionManager || !currentUserId) {
      return;
    }

    // 캐시 정리 후 다시 로드
    permissionManager.clearUserPermissions(currentUserId);
    await loadUserPermissions();
  };

  const contextValue: PermissionContextValue = {
    permissionManager,
    currentUserId,
    isLoading,
    error,
    reloadPermissions
  };

  return (
    <PermissionContext.Provider value={contextValue}>
      {children}
    </PermissionContext.Provider>
  );
}