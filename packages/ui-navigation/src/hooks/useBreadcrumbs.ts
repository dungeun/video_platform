/**
 * useBreadcrumbs Hook
 * 브레드크럼 상태 관리
 */

import { useState, useCallback, useMemo } from 'react';
import { BreadcrumbItem, NavigationItem } from '../types';
import { generateBreadcrumbs } from '../utils/navigationHelpers';

export interface UseBreadcrumbsOptions {
  items?: BreadcrumbItem[];
  navigationItems?: NavigationItem[];
  currentPath?: string;
  maxItems?: number;
  showHome?: boolean;
  homeItem?: BreadcrumbItem;
  onItemClick?: (item: BreadcrumbItem, index: number) => void;
}

export interface UseBreadcrumbsReturn {
  breadcrumbs: BreadcrumbItem[];
  visibleBreadcrumbs: BreadcrumbItem[];
  collapsedCount: number;
  isCollapsed: boolean;
  showCollapsed: boolean;
  toggleCollapsed: () => void;
  handleItemClick: (item: BreadcrumbItem, index: number) => void;
  addBreadcrumb: (item: BreadcrumbItem) => void;
  removeBreadcrumb: (index: number) => void;
  clearBreadcrumbs: () => void;
  setBreadcrumbs: (items: BreadcrumbItem[]) => void;
}

export const useBreadcrumbs = (options: UseBreadcrumbsOptions): UseBreadcrumbsReturn => {
  const {
    items,
    navigationItems,
    currentPath,
    maxItems = 4,
    showHome = true,
    homeItem = { id: 'home', label: 'Home', href: '/' },
    onItemClick
  } = options;
  
  const [showCollapsed, setShowCollapsed] = useState(false);
  
  // 브레드크럼 생성
  const breadcrumbs = useMemo(() => {
    let result: BreadcrumbItem[] = [];
    
    // 직접 제공된 아이템 사용
    if (items) {
      result = [...items];
    }
    // 네비게이션 아이템에서 생성
    else if (navigationItems && currentPath) {
      result = generateBreadcrumbs(navigationItems, currentPath);
    }
    
    // 홈 아이템 추가
    if (showHome && result.length > 0 && result[0]?.id !== homeItem.id) {
      result.unshift(homeItem);
    }
    
    return result;
  }, [items, navigationItems, currentPath, showHome, homeItem]);
  
  // 표시할 브레드크럼 계산
  const { visibleBreadcrumbs, collapsedCount, isCollapsed } = useMemo(() => {
    if (!maxItems || breadcrumbs.length <= maxItems) {
      return {
        visibleBreadcrumbs: breadcrumbs,
        collapsedCount: 0,
        isCollapsed: false
      };
    }
    
    if (showCollapsed) {
      return {
        visibleBreadcrumbs: breadcrumbs,
        collapsedCount: 0,
        isCollapsed: false
      };
    }
    
    // 첫 번째, 마지막 아이템과 현재 아이템 근처만 표시
    const firstItem = breadcrumbs[0];
    const collapsed = breadcrumbs.length - maxItems;
    
    let visible: BreadcrumbItem[] = [];
    
    if (breadcrumbs.length > maxItems && firstItem) {
      // 첫 번째 아이템
      visible.push(firstItem);
      
      // 생략 표시를 위한 더미 아이템
      if (collapsed > 0) {
        visible.push({
          id: 'collapsed',
          label: '...',
          onClick: () => setShowCollapsed(true)
        });
      }
      
      // 마지막 몇 개 아이템
      const remainingSlots = maxItems - 2; // 첫 번째와 생략 표시 제외
      const startIndex = Math.max(1, breadcrumbs.length - remainingSlots);
      
      for (let i = startIndex; i < breadcrumbs.length; i++) {
        const item = breadcrumbs[i];
        if (item && item !== firstItem) {
          visible.push(item);
        }
      }
    } else {
      visible = breadcrumbs;
    }
    
    return {
      visibleBreadcrumbs: visible,
      collapsedCount: collapsed,
      isCollapsed: collapsed > 0
    };
  }, [breadcrumbs, maxItems, showCollapsed]);
  
  // 접힌 상태 토글
  const toggleCollapsed = useCallback(() => {
    setShowCollapsed(prev => !prev);
  }, []);
  
  // 아이템 클릭 핸들러
  const handleItemClick = useCallback((item: BreadcrumbItem, index: number) => {
    if (item.id === 'collapsed') {
      toggleCollapsed();
      return;
    }
    
    // 커스텀 핸들러 실행
    onItemClick?.(item, index);
    
    // 아이템 자체 핸들러 실행
    if (item.onClick) {
      item.onClick({} as any);
    }
  }, [onItemClick, toggleCollapsed]);
  
  // 브레드크럼 추가
  const addBreadcrumb = useCallback((_item: BreadcrumbItem) => {
    // 직접 관리하는 경우에만 사용 (items prop 사용시)
    console.warn('addBreadcrumb is only available when managing breadcrumbs directly');
  }, []);
  
  // 브레드크럼 제거
  const removeBreadcrumb = useCallback((_index: number) => {
    // 직접 관리하는 경우에만 사용 (items prop 사용시)
    console.warn('removeBreadcrumb is only available when managing breadcrumbs directly');
  }, []);
  
  // 모든 브레드크럼 제거
  const clearBreadcrumbs = useCallback(() => {
    // 직접 관리하는 경우에만 사용 (items prop 사용시)
    console.warn('clearBreadcrumbs is only available when managing breadcrumbs directly');
  }, []);
  
  // 브레드크럼 설정
  const setBreadcrumbs = useCallback((_newItems: BreadcrumbItem[]) => {
    // 직접 관리하는 경우에만 사용 (items prop 사용시)
    console.warn('setBreadcrumbs is only available when managing breadcrumbs directly');
  }, []);
  
  return {
    breadcrumbs,
    visibleBreadcrumbs,
    collapsedCount,
    isCollapsed,
    showCollapsed,
    toggleCollapsed,
    handleItemClick,
    addBreadcrumb,
    removeBreadcrumb,
    clearBreadcrumbs,
    setBreadcrumbs
  };
};