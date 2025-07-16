/**
 * useUserMenu Hook
 * 사용자 메뉴 상태 관리
 */
import { UserMenuItem, UserInfo } from '../types';
export interface UseUserMenuOptions {
    user: UserInfo;
    items: UserMenuItem[];
    onItemClick?: (item: UserMenuItem) => void;
    closeOnItemClick?: boolean;
    closeOnOutsideClick?: boolean;
}
export interface UseUserMenuReturn {
    isOpen: boolean;
    user: UserInfo;
    items: UserMenuItem[];
    open: () => void;
    close: () => void;
    toggle: () => void;
    handleItemClick: (item: UserMenuItem) => void;
    handleOutsideClick: (event: MouseEvent) => void;
    menuRef: React.RefObject<HTMLDivElement>;
    triggerRef: React.RefObject<HTMLButtonElement>;
    menuProps: {
        ref: React.RefObject<HTMLDivElement>;
        className: string;
        'data-testid': string;
    };
    triggerProps: {
        ref: React.RefObject<HTMLButtonElement>;
        onClick: () => void;
        'aria-expanded': boolean;
        'aria-haspopup': boolean;
    };
}
export declare const useUserMenu: (options: UseUserMenuOptions) => UseUserMenuReturn;
//# sourceMappingURL=useUserMenu.d.ts.map