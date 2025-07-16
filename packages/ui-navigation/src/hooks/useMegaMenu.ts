/**
 * useMegaMenu Hook
 * 메가 메뉴 상태 관리
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { MegaMenuItem } from '../types';

export interface UseMegaMenuOptions {
  items: MegaMenuItem[];
  trigger?: 'hover' | 'click';
  delay?: number;
  onOpen?: (menuId: string) => void;
  onClose?: (menuId: string) => void;
}

export interface UseMegaMenuReturn {
  openMenuId: string | null;
  isMenuOpen: (menuId: string) => boolean;
  openMenu: (menuId: string) => void;
  closeMenu: () => void;
  toggleMenu: (menuId: string) => void;
  handleMouseEnter: (menuId: string) => void;
  handleMouseLeave: () => void;
  handleClick: (menuId: string) => void;
  menuProps: (menuId: string) => {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onClick: () => void;
  };
}

export const useMegaMenu = (options: UseMegaMenuOptions): UseMegaMenuReturn => {
  const { trigger = 'hover', delay = 150, onOpen, onClose } = options;
  
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 타이머 정리
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  // 메뉴 열기
  const openMenu = useCallback((menuId: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (openMenuId !== menuId) {
      setOpenMenuId(menuId);
      onOpen?.(menuId);
    }
  }, [openMenuId, onOpen]);
  
  // 메뉴 닫기
  const closeMenu = useCallback(() => {
    if (openMenuId) {
      const previousMenuId = openMenuId;
      setOpenMenuId(null);
      onClose?.(previousMenuId);
    }
  }, [openMenuId, onClose]);
  
  // 메뉴 토글
  const toggleMenu = useCallback((menuId: string) => {
    if (openMenuId === menuId) {
      closeMenu();
    } else {
      openMenu(menuId);
    }
  }, [openMenuId, openMenu, closeMenu]);
  
  // 메뉴 열린 상태 확인
  const isMenuOpen = useCallback((menuId: string) => {
    return openMenuId === menuId;
  }, [openMenuId]);
  
  // 마우스 엔터 핸들러
  const handleMouseEnter = useCallback((menuId: string) => {
    if (trigger === 'hover') {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      openMenu(menuId);
    }
  }, [trigger, openMenu]);
  
  // 마우스 리브 핸들러
  const handleMouseLeave = useCallback(() => {
    if (trigger === 'hover') {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        closeMenu();
      }, delay);
    }
  }, [trigger, delay, closeMenu]);
  
  // 클릭 핸들러
  const handleClick = useCallback((menuId: string) => {
    if (trigger === 'click') {
      toggleMenu(menuId);
    }
  }, [trigger, toggleMenu]);
  
  // 메뉴 아이템 props 생성
  const menuProps = useCallback((menuId: string) => ({
    onMouseEnter: () => handleMouseEnter(menuId),
    onMouseLeave: handleMouseLeave,
    onClick: () => handleClick(menuId)
  }), [handleMouseEnter, handleMouseLeave, handleClick]);
  
  // 외부 클릭시 메뉴 닫기
  useEffect(() => {
    if (trigger === 'click' && openMenuId) {
      const handleDocumentClick = (event: MouseEvent) => {
        const target = event.target as Element;
        const menuElement = document.querySelector(`[data-menu-id="${openMenuId}"]`);
        
        if (menuElement && !menuElement.contains(target)) {
          closeMenu();
        }
      };
      
      document.addEventListener('click', handleDocumentClick);
      return () => {
        document.removeEventListener('click', handleDocumentClick);
      };
    }
    return undefined;
  }, [trigger, openMenuId, closeMenu]);
  
  // ESC 키로 메뉴 닫기
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && openMenuId) {
        closeMenu();
      }
    };
    
    if (openMenuId) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
    return undefined;
  }, [openMenuId, closeMenu]);
  
  return {
    openMenuId,
    isMenuOpen,
    openMenu,
    closeMenu,
    toggleMenu,
    handleMouseEnter,
    handleMouseLeave,
    handleClick,
    menuProps
  };
};