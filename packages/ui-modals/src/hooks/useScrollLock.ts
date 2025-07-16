/**
 * @company/ui-modals - Scroll Lock Hook
 * 
 * 모달 열림 시 배경 스크롤 방지
 */

import { useEffect, useRef } from 'react';

export function useScrollLock(enabled: boolean = true) {
  const scrollbarWidth = useRef<number>(0);
  const originalStyles = useRef<{
    overflow: string;
    paddingRight: string;
  }>({
    overflow: '',
    paddingRight: ''
  });
  
  useEffect(() => {
    if (!enabled) return;
    
    // Calculate scrollbar width
    const calculateScrollbarWidth = () => {
      const outer = document.createElement('div');
      outer.style.visibility = 'hidden';
      outer.style.overflow = 'scroll';
      (outer.style as any).msOverflowStyle = 'scrollbar';
      document.body.appendChild(outer);
      
      const inner = document.createElement('div');
      outer.appendChild(inner);
      
      const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
      outer.parentNode?.removeChild(outer);
      
      return scrollbarWidth;
    };
    
    // Store original styles
    originalStyles.current = {
      overflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight
    };
    
    // Check if scrollbar is visible
    const hasScrollbar = document.body.scrollHeight > window.innerHeight;
    
    if (hasScrollbar) {
      scrollbarWidth.current = calculateScrollbarWidth();
      document.body.style.paddingRight = `${scrollbarWidth.current}px`;
    }
    
    // Lock scroll
    document.body.style.overflow = 'hidden';
    
    // Cleanup
    return () => {
      document.body.style.overflow = originalStyles.current.overflow;
      document.body.style.paddingRight = originalStyles.current.paddingRight;
    };
  }, [enabled]);
}