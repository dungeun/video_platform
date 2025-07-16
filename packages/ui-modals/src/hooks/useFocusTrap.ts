/**
 * @company/ui-modals - Focus Trap Hook
 * 
 * 모달 내 포커스 가두기 기능
 */

import { useEffect, useCallback, useRef } from 'react';

interface UseFocusTrapOptions {
  containerRef: React.RefObject<HTMLElement>;
  enabled?: boolean;
  autoFocus?: boolean;
  returnFocus?: HTMLElement | false;
}

export function useFocusTrap({
  containerRef,
  enabled = true,
  autoFocus = true,
  returnFocus = false
}: UseFocusTrapOptions) {
  const previousActiveElement = useRef<HTMLElement | null>(null);
  
  // Get all focusable elements
  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',');
    
    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(focusableSelectors)
    ).filter(el => {
      // Check if element is visible
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
  }, [containerRef]);
  
  // Handle tab key
  const handleTabKey = useCallback((e: KeyboardEvent) => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (e.shiftKey) {
      // Shift + Tab
      if (firstElement && document.activeElement === firstElement && lastElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (lastElement && document.activeElement === lastElement && firstElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }, [getFocusableElements]);
  
  // Activate focus trap
  const activateTrap = useCallback(() => {
    if (!enabled || !containerRef.current) return;
    
    // Store current active element
    previousActiveElement.current = document.activeElement as HTMLElement;
    
    // Auto focus first element
    if (autoFocus) {
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        // Try to find autofocus element first
        const autoFocusElement = containerRef.current.querySelector<HTMLElement>('[autofocus]');
        if (autoFocusElement) {
          autoFocusElement.focus();
        } else if (focusableElements[0]) {
          focusableElements[0].focus();
        }
      } else {
        // Focus container itself if no focusable elements
        containerRef.current.focus();
      }
    }
    
    // Add event listener
    document.addEventListener('keydown', handleTabKey);
  }, [enabled, containerRef, autoFocus, getFocusableElements, handleTabKey]);
  
  // Deactivate focus trap
  const deactivateTrap = useCallback(() => {
    document.removeEventListener('keydown', handleTabKey);
    
    // Return focus
    if (returnFocus) {
      if (returnFocus instanceof HTMLElement) {
        returnFocus.focus();
      } else if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }
  }, [handleTabKey, returnFocus]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      deactivateTrap();
    };
  }, [deactivateTrap]);
  
  return {
    activateTrap,
    deactivateTrap,
    getFocusableElements
  };
}