/**
 * useKeyboardNavigation Hook
 * 키보드 네비게이션 관리
 */
export interface UseKeyboardNavigationOptions {
    containerRef?: React.RefObject<HTMLElement>;
    orientation?: 'horizontal' | 'vertical' | 'both';
    loop?: boolean;
    disabled?: boolean;
    onFocusChange?: (index: number, element: HTMLElement) => void;
    onActivate?: (index: number, element: HTMLElement) => void;
    onEscape?: () => void;
}
export interface UseKeyboardNavigationReturn {
    currentIndex: number;
    focusedElement: HTMLElement | null;
    setCurrentIndex: (index: number) => void;
    focusFirst: () => void;
    focusLast: () => void;
    focusNext: () => void;
    focusPrevious: () => void;
    focusIndex: (index: number) => void;
    activate: (index?: number) => void;
    handleKeyDown: (event: React.KeyboardEvent) => void;
    containerProps: {
        onKeyDown: (event: React.KeyboardEvent) => void;
        tabIndex: number;
    };
}
export declare const useKeyboardNavigation: (options: UseKeyboardNavigationOptions) => UseKeyboardNavigationReturn;
//# sourceMappingURL=useKeyboardNavigation.d.ts.map