/**
 * Accessibility Utilities
 * 접근성 관련 유틸리티
 */
/**
 * ARIA 역할 정의
 */
export declare const ARIA_ROLES: {
    readonly NAVIGATION: "navigation";
    readonly MENU: "menu";
    readonly MENUBAR: "menubar";
    readonly MENUITEM: "menuitem";
    readonly SUBMENU: "menu";
    readonly BUTTON: "button";
    readonly LINK: "link";
    readonly LISTBOX: "listbox";
    readonly OPTION: "option";
    readonly COMBOBOX: "combobox";
    readonly SEARCHBOX: "searchbox";
    readonly BREADCRUMB: "navigation";
};
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
export declare const createNavigationAria: (options: {
    label?: string;
    labelledBy?: string;
    current?: boolean;
    expanded?: boolean;
    hasPopup?: boolean;
    controls?: string;
}) => AriaAttributes;
/**
 * 메뉴 접근성 속성 생성
 */
export declare const createMenuAria: (options: {
    label?: string;
    labelledBy?: string;
    orientation?: "horizontal" | "vertical";
    expanded?: boolean;
    activeDescendant?: string;
}) => AriaAttributes;
/**
 * 메뉴 아이템 접근성 속성 생성
 */
export declare const createMenuItemAria: (options: {
    selected?: boolean;
    disabled?: boolean;
    hasPopup?: boolean;
    expanded?: boolean;
    controls?: string;
    posInSet?: number;
    setSize?: number;
}) => AriaAttributes;
/**
 * 버튼 접근성 속성 생성
 */
export declare const createButtonAria: (options: {
    label?: string;
    describedBy?: string;
    expanded?: boolean;
    hasPopup?: boolean;
    controls?: string;
    pressed?: boolean;
    disabled?: boolean;
}) => AriaAttributes;
/**
 * 검색박스 접근성 속성 생성
 */
export declare const createSearchboxAria: (options: {
    label?: string;
    describedBy?: string;
    expanded?: boolean;
    controls?: string;
    activeDescendant?: string;
    autocomplete?: string;
}) => AriaAttributes;
/**
 * 브레드크럼 접근성 속성 생성
 */
export declare const createBreadcrumbAria: (options: {
    label?: string;
    current?: boolean;
}) => AriaAttributes;
/**
 * 실시간 영역 생성 (스크린 리더 알림용)
 */
export declare const createLiveRegion: (options: {
    polite?: boolean;
    atomic?: boolean;
    relevant?: string;
}) => AriaAttributes;
/**
 * 키보드 단축키 힌트 생성
 */
export declare const createKeyboardHint: (key: string) => string;
/**
 * 포커스 관리 유틸리티
 */
export declare const manageFocus: {
    /**
     * 요소에 포커스 설정 (지연 옵션)
     */
    set: (element: HTMLElement | null, delay?: number) => void;
    /**
     * 이전 포커스 저장 및 복원
     */
    save: () => HTMLElement | null;
    restore: (element: HTMLElement | null) => void;
};
/**
 * 스크린 리더 전용 텍스트 스타일
 */
export declare const getScreenReaderOnlyStyles: () => React.CSSProperties;
/**
 * 고대비 모드 감지
 */
export declare const isHighContrastMode: () => boolean;
/**
 * 애니메이션 감소 모드 감지
 */
export declare const isPrefersReducedMotion: () => boolean;
//# sourceMappingURL=accessibility.d.ts.map