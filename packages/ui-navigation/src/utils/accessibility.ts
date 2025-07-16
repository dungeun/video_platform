/**
 * Accessibility Utilities
 * 접근성 관련 유틸리티
 */

/**
 * ARIA 역할 정의
 */
export const ARIA_ROLES = {
  NAVIGATION: 'navigation',
  MENU: 'menu',
  MENUBAR: 'menubar',
  MENUITEM: 'menuitem',
  SUBMENU: 'menu',
  BUTTON: 'button',
  LINK: 'link',
  LISTBOX: 'listbox',
  OPTION: 'option',
  COMBOBOX: 'combobox',
  SEARCHBOX: 'searchbox',
  BREADCRUMB: 'navigation'
} as const;

/**
 * ARIA 속성 생성
 */
export interface AriaAttributes {
  role?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-current'?: 'page' | 'step' | 'location' | 'date' | 'time' | boolean;
  'aria-haspopup'?: boolean | 'false' | 'true' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  'aria-owns'?: string;
  'aria-controls'?: string;
  'aria-activedescendant'?: string;
  'aria-selected'?: boolean;
  'aria-checked'?: boolean;
  'aria-disabled'?: boolean;
  'aria-hidden'?: boolean;
  'aria-live'?: 'polite' | 'assertive' | 'off';
  'aria-atomic'?: boolean;
  'aria-relevant'?: string;
  'aria-busy'?: boolean;
  'aria-orientation'?: 'horizontal' | 'vertical';
  'aria-setsize'?: number;
  'aria-posinset'?: number;
  'aria-pressed'?: boolean;
}

/**
 * 네비게이션 접근성 속성 생성
 */
export const createNavigationAria = (options: {
  label?: string;
  labelledBy?: string;
  current?: boolean;
  expanded?: boolean;
  hasPopup?: boolean;
  controls?: string;
}): AriaAttributes => {
  const aria: AriaAttributes = {
    role: ARIA_ROLES.NAVIGATION
  };
  
  if (options.label) {
    aria['aria-label'] = options.label;
  }
  
  if (options.labelledBy) {
    aria['aria-labelledby'] = options.labelledBy;
  }
  
  if (options.current) {
    aria['aria-current'] = 'page';
  }
  
  if (options.expanded !== undefined) {
    aria['aria-expanded'] = options.expanded;
  }
  
  if (options.hasPopup) {
    aria['aria-haspopup'] = 'menu';
  }
  
  if (options.controls) {
    aria['aria-controls'] = options.controls;
  }
  
  return aria;
};

/**
 * 메뉴 접근성 속성 생성
 */
export const createMenuAria = (options: {
  label?: string;
  labelledBy?: string;
  orientation?: 'horizontal' | 'vertical';
  expanded?: boolean;
  activeDescendant?: string;
}): AriaAttributes => {
  const aria: AriaAttributes = {
    role: ARIA_ROLES.MENU
  };
  
  if (options.label) {
    aria['aria-label'] = options.label;
  }
  
  if (options.labelledBy) {
    aria['aria-labelledby'] = options.labelledBy;
  }
  
  if (options.orientation) {
    aria['aria-orientation'] = options.orientation;
  }
  
  if (options.expanded !== undefined) {
    aria['aria-expanded'] = options.expanded;
  }
  
  if (options.activeDescendant) {
    aria['aria-activedescendant'] = options.activeDescendant;
  }
  
  return aria;
};

/**
 * 메뉴 아이템 접근성 속성 생성
 */
export const createMenuItemAria = (options: {
  selected?: boolean;
  disabled?: boolean;
  hasPopup?: boolean;
  expanded?: boolean;
  controls?: string;
  posInSet?: number;
  setSize?: number;
}): AriaAttributes => {
  const aria: AriaAttributes = {
    role: ARIA_ROLES.MENUITEM
  };
  
  if (options.selected !== undefined) {
    aria['aria-selected'] = options.selected;
  }
  
  if (options.disabled) {
    aria['aria-disabled'] = options.disabled;
  }
  
  if (options.hasPopup) {
    aria['aria-haspopup'] = 'menu';
  }
  
  if (options.expanded !== undefined) {
    aria['aria-expanded'] = options.expanded;
  }
  
  if (options.controls) {
    aria['aria-controls'] = options.controls;
  }
  
  if (options.posInSet) {
    aria['aria-posinset'] = options.posInSet;
  }
  
  if (options.setSize) {
    aria['aria-setsize'] = options.setSize;
  }
  
  return aria;
};

/**
 * 버튼 접근성 속성 생성
 */
export const createButtonAria = (options: {
  label?: string;
  describedBy?: string;
  expanded?: boolean;
  hasPopup?: boolean;
  controls?: string;
  pressed?: boolean;
  disabled?: boolean;
}): AriaAttributes => {
  const aria: AriaAttributes = {
    role: ARIA_ROLES.BUTTON
  };
  
  if (options.label) {
    aria['aria-label'] = options.label;
  }
  
  if (options.describedBy) {
    aria['aria-describedby'] = options.describedBy;
  }
  
  if (options.expanded !== undefined) {
    aria['aria-expanded'] = options.expanded;
  }
  
  if (options.hasPopup) {
    aria['aria-haspopup'] = 'menu';
  }
  
  if (options.controls) {
    aria['aria-controls'] = options.controls;
  }
  
  if (options.pressed !== undefined) {
    aria['aria-pressed'] = options.pressed;
  }
  
  if (options.disabled) {
    aria['aria-disabled'] = options.disabled;
  }
  
  return aria;
};

/**
 * 검색박스 접근성 속성 생성
 */
export const createSearchboxAria = (options: {
  label?: string;
  describedBy?: string;
  expanded?: boolean;
  controls?: string;
  activeDescendant?: string;
  autocomplete?: string;
}): AriaAttributes => {
  const aria: AriaAttributes = {
    role: ARIA_ROLES.SEARCHBOX
  };
  
  if (options.label) {
    aria['aria-label'] = options.label;
  }
  
  if (options.describedBy) {
    aria['aria-describedby'] = options.describedBy;
  }
  
  if (options.expanded !== undefined) {
    aria['aria-expanded'] = options.expanded;
  }
  
  if (options.controls) {
    aria['aria-controls'] = options.controls;
  }
  
  if (options.activeDescendant) {
    aria['aria-activedescendant'] = options.activeDescendant;
  }
  
  return aria;
};

/**
 * 브레드크럼 접근성 속성 생성
 */
export const createBreadcrumbAria = (options: {
  label?: string;
  current?: boolean;
}): AriaAttributes => {
  const aria: AriaAttributes = {
    role: ARIA_ROLES.BREADCRUMB
  };
  
  if (options.label) {
    aria['aria-label'] = options.label;
  }
  
  if (options.current) {
    aria['aria-current'] = 'page';
  }
  
  return aria;
};

/**
 * 실시간 영역 생성 (스크린 리더 알림용)
 */
export const createLiveRegion = (options: {
  polite?: boolean;
  atomic?: boolean;
  relevant?: string;
}): AriaAttributes => {
  return {
    'aria-live': options.polite ? 'polite' : 'assertive',
    'aria-atomic': options.atomic ?? false,
    'aria-relevant': options.relevant ?? 'additions text'
  };
};

/**
 * 키보드 단축키 힌트 생성
 */
export const createKeyboardHint = (key: string): string => {
  const isMac = typeof navigator !== 'undefined' && 
    /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  
  const modifierKey = isMac ? '⌘' : 'Ctrl';
  
  switch (key.toLowerCase()) {
    case 'enter':
      return 'Enter 키를 눌러 활성화';
    case 'space':
      return 'Space 키를 눌러 활성화';
    case 'escape':
      return 'Esc 키를 눌러 닫기';
    case 'tab':
      return 'Tab 키로 이동';
    case 'arrow':
      return '방향키로 이동';
    default:
      return `${modifierKey}+${key.toUpperCase()}`;
  }
};

/**
 * 포커스 관리 유틸리티
 */
export const manageFocus = {
  /**
   * 요소에 포커스 설정 (지연 옵션)
   */
  set: (element: HTMLElement | null, delay = 0) => {
    if (!element) return;
    
    if (delay > 0) {
      setTimeout(() => element.focus(), delay);
    } else {
      element.focus();
    }
  },
  
  /**
   * 이전 포커스 저장 및 복원
   */
  save: () => {
    return document.activeElement as HTMLElement | null;
  },
  
  restore: (element: HTMLElement | null) => {
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  }
};

/**
 * 스크린 리더 전용 텍스트 스타일
 */
export const getScreenReaderOnlyStyles = (): React.CSSProperties => ({
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0
});

/**
 * 고대비 모드 감지
 */
export const isHighContrastMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(prefers-contrast: high)').matches;
};

/**
 * 애니메이션 감소 모드 감지
 */
export const isPrefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};