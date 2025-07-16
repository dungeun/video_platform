/**
 * useMegaMenu Hook
 * 메가 메뉴 상태 관리
 */
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
export declare const useMegaMenu: (options: UseMegaMenuOptions) => UseMegaMenuReturn;
//# sourceMappingURL=useMegaMenu.d.ts.map