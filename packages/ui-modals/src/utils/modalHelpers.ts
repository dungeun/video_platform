/**
 * @repo/ui-modals - Modal Helpers
 * 
 * 모달 관련 헬퍼 함수
 */

// Generate unique modal ID
export const generateModalId = (prefix: string = 'modal'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Check if click is outside element
export const isClickOutside = (
  event: MouseEvent,
  element: HTMLElement | null
): boolean => {
  if (!element) return false;
  return !element.contains(event.target as Node);
};

// Get focusable elements
export const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');
  
  return Array.from(
    container.querySelectorAll<HTMLElement>(focusableSelectors)
  ).filter(el => {
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden';
  });
};

// Trap focus within element
export const trapFocus = (element: HTMLElement): void => {
  const focusableElements = getFocusableElements(element);
  if (focusableElements.length === 0) return;
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      if (firstElement && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      if (lastElement && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };
  
  element.addEventListener('keydown', handleTabKey);
  
  // Add cleanup function to element for later removal
  (element as any)._trapFocusCleanup = () => {
    element.removeEventListener('keydown', handleTabKey);
  };
};

// Merge refs
export const mergeRefs = <T>(...refs: Array<React.Ref<T> | undefined>): React.RefCallback<T> => {
  return (value: T) => {
    refs.forEach(ref => {
      if (typeof ref === 'function') {
        ref(value);
      } else if (ref && 'current' in ref) {
        (ref as React.MutableRefObject<T>).current = value;
      }
    });
  };
};

// Prevent body scroll
export const preventBodyScroll = (prevent: boolean): void => {
  if (prevent) {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
  } else {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }
};

// Create modal root element
export const createModalRoot = (id: string = 'modal-root'): HTMLElement => {
  let root = document.getElementById(id);
  
  if (!root) {
    root = document.createElement('div');
    root.id = id;
    root.style.position = 'relative';
    root.style.zIndex = '9999';
    document.body.appendChild(root);
  }
  
  return root;
};

// Format modal aria attributes
export const getModalAriaAttributes = (props: {
  ariaLabel?: string;
  ariaDescribedBy?: string;
  title?: string;
  role?: string;
}) => {
  return {
    role: props.role || 'dialog',
    'aria-modal': true,
    'aria-label': props.ariaLabel || props.title,
    'aria-describedby': props.ariaDescribedBy
  };
};