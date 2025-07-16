/**
 * useNavigation Hook
 * 기본 네비게이션 상태 관리
 */

import { useState, useCallback, useEffect } from 'react';
import { NavigationItem } from '../types';
import { isNavigationItemActive, findActiveNavigationItem } from '../utils/navigationHelpers';

export interface UseNavigationOptions {
  items: NavigationItem[];
  currentPath?: string;
  onItemClick?: (item: NavigationItem) => void;
  autoDetectActive?: boolean;
}

export interface UseNavigationReturn {
  items: NavigationItem[];
  activeItem: NavigationItem | null;
  setActiveItem: (item: NavigationItem | null) => void;
  handleItemClick: (item: NavigationItem) => void;
  isItemActive: (item: NavigationItem) => boolean;
  getItemById: (id: string) => NavigationItem | null;
}

export const useNavigation = (options: UseNavigationOptions): UseNavigationReturn => {
  const { items, currentPath, onItemClick, autoDetectActive = true } = options;
  
  const [activeItem, setActiveItem] = useState<NavigationItem | null>(null);
  
  // 현재 경로 기반으로 활성 아이템 자동 감지
  useEffect(() => {
    if (autoDetectActive && currentPath) {
      const active = findActiveNavigationItem(items, currentPath);
      setActiveItem(active);
    }
  }, [items, currentPath, autoDetectActive]);
  
  // 아이템 클릭 핸들러
  const handleItemClick = useCallback((item: NavigationItem) => {
    if (item.disabled) return;
    
    setActiveItem(item);
    onItemClick?.(item);
    
    // href가 있는 경우 네비게이션 수행
    if (item.href && item.onClick) {
      item.onClick({} as any);
    }
  }, [onItemClick]);
  
  // 아이템 활성 상태 확인
  const isItemActive = useCallback((item: NavigationItem) => {
    if (activeItem?.id === item.id) return true;
    if (currentPath) {
      return isNavigationItemActive(item, currentPath);
    }
    return false;
  }, [activeItem, currentPath]);
  
  // ID로 아이템 찾기
  const getItemById = useCallback((id: string): NavigationItem | null => {
    const findItem = (items: NavigationItem[]): NavigationItem | null => {
      for (const item of items) {
        if (item.id === id) return item;
        if (item.children) {
          const found = findItem(item.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    return findItem(items);
  }, [items]);
  
  return {
    items,
    activeItem,
    setActiveItem,
    handleItemClick,
    isItemActive,
    getItemById
  };
};