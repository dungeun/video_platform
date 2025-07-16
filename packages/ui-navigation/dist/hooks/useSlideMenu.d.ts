/**
 * useSlideMenu Hook
 * 슬라이드 메뉴 상태 관리
 */
import { NavigationItem } from '../types';
export interface UseSlideMenuOptions {
    isOpen: boolean;
    onClose: () => void;
    overlay?: boolean;
    closeOnOverlayClick?: boolean;
    closeOnEscape?: boolean;
    preventBodyScroll?: boolean;
}
export interface UseSlideMenuReturn {
    isAnimating: boolean;
    handleOverlayClick: () => void;
    handleItemClick: (item: NavigationItem, onItemClick?: (item: NavigationItem) => void) => void;
    overlayProps: {
        onClick: () => void;
        className: string;
    };
    menuProps: {
        className: string;
        'data-testid': string;
    };
}
export declare const useSlideMenu: (options: UseSlideMenuOptions) => UseSlideMenuReturn;
//# sourceMappingURL=useSlideMenu.d.ts.map