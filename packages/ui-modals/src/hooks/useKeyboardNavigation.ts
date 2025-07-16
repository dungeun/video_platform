/**
 * @repo/ui-modals - Keyboard Navigation Hook
 * 
 * 모달 키보드 네비게이션 지원
 */

import { useEffect, useCallback } from 'react';

interface UseKeyboardNavigationOptions {
  containerRef: React.RefObject<HTMLElement>;
  enabled?: boolean;
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  preventDefault?: boolean;
}

export function useKeyboardNavigation({
  containerRef,
  enabled = true,
  onEscape,
  onEnter,
  onArrowUp,
  onArrowDown,
  onArrowLeft,
  onArrowRight,
  preventDefault = true
}: UseKeyboardNavigationOptions) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled || !containerRef.current) return;
    
    // Check if event target is within container
    const target = e.target as HTMLElement;
    if (!containerRef.current.contains(target)) return;
    
    switch (e.key) {
      case 'Escape':
        if (onEscape) {
          if (preventDefault) e.preventDefault();
          onEscape();
        }
        break;
        
      case 'Enter':
        if (onEnter) {
          if (preventDefault) e.preventDefault();
          onEnter();
        }
        break;
        
      case 'ArrowUp':
        if (onArrowUp) {
          if (preventDefault) e.preventDefault();
          onArrowUp();
        }
        break;
        
      case 'ArrowDown':
        if (onArrowDown) {
          if (preventDefault) e.preventDefault();
          onArrowDown();
        }
        break;
        
      case 'ArrowLeft':
        if (onArrowLeft) {
          if (preventDefault) e.preventDefault();
          onArrowLeft();
        }
        break;
        
      case 'ArrowRight':
        if (onArrowRight) {
          if (preventDefault) e.preventDefault();
          onArrowRight();
        }
        break;
    }
  }, [
    enabled,
    containerRef,
    onEscape,
    onEnter,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    preventDefault
  ]);
  
  useEffect(() => {
    if (!enabled) return;
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
  
  // Return navigation helpers
  return {
    navigateToNext: useCallback(() => {
      if (!containerRef.current) return;
      
      const focusableElements = Array.from(
        containerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      
      const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
      if (currentIndex >= 0 && currentIndex < focusableElements.length - 1) {
        focusableElements[currentIndex + 1]?.focus();
      }
    }, [containerRef]),
    
    navigateToPrevious: useCallback(() => {
      if (!containerRef.current) return;
      
      const focusableElements = Array.from(
        containerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      
      const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
      if (currentIndex > 0) {
        focusableElements[currentIndex - 1]?.focus();
      }
    }, [containerRef])
  };
}