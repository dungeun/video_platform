/**
 * useMobileNavigation Hook
 * 모바일 네비게이션 상태 관리
 */
import { NavigationItem } from '../types';
export interface UseMobileNavigationOptions {
    items: NavigationItem[];
    breakpoint?: number;
    autoDetectMobile?: boolean;
    closeOnItemClick?: boolean;
    closeOnOutsideClick?: boolean;
    preventBodyScroll?: boolean;
}
export interface UseMobileNavigationReturn {
    isOpen: boolean;
    isMobile: boolean;
    activeSubmenu: string | null;
    toggle: () => void;
    open: () => void;
    close: () => void;
    openSubmenu: (itemId: string) => void;
    closeSubmenu: () => void;
    handleItemClick: (item: NavigationItem, onItemClick?: (item: NavigationItem) => void) => void;
    handleBackdropClick: () => void;
    navigationProps: {
        className: string;
        'data-testid': string;
        'aria-expanded': boolean;
    };
    backdropProps: {
        onClick: () => void;
        className: string;
    };
}
export declare const useMobileNavigation: (options: UseMobileNavigationOptions) => UseMobileNavigationReturn;
//# sourceMappingURL=useMobileNavigation.d.ts.map