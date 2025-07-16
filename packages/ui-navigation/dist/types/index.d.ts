/**
 * @repo/ui-navigation Types
 *
 * 네비게이션 컴포넌트 타입 정의
 */
import { ReactNode, MouseEvent, KeyboardEvent } from 'react';
export interface BaseNavigationProps {
    className?: string;
    children?: ReactNode;
    'data-testid'?: string;
}
export interface NavigationItem {
    id: string;
    label: string;
    href?: string;
    icon?: ReactNode;
    disabled?: boolean;
    onClick?: (event: MouseEvent<HTMLElement>) => void;
    children?: NavigationItem[];
}
export interface MegaMenuProps extends BaseNavigationProps {
    items: MegaMenuItem[];
    trigger?: 'hover' | 'click';
    delay?: number;
    position?: 'left' | 'center' | 'right';
    width?: 'auto' | 'full' | number;
    onOpen?: (menuId: string) => void;
    onClose?: (menuId: string) => void;
}
export interface MegaMenuItem extends NavigationItem {
    content?: ReactNode;
    columns?: MegaMenuColumn[];
    featured?: boolean;
}
export interface MegaMenuColumn {
    id: string;
    title?: string;
    items: NavigationItem[];
    featured?: boolean;
}
export interface SlideMenuProps extends BaseNavigationProps {
    items: NavigationItem[];
    isOpen: boolean;
    onClose: () => void;
    position?: 'left' | 'right';
    overlay?: boolean;
    width?: number | string;
    onItemClick?: (item: NavigationItem) => void;
}
export interface MobileNavigationProps extends BaseNavigationProps {
    items: NavigationItem[];
    isOpen: boolean;
    onToggle: () => void;
    position?: 'top' | 'bottom';
    showBackdrop?: boolean;
    hamburgerIcon?: ReactNode;
    closeIcon?: ReactNode;
}
export interface BreadcrumbProps extends BaseNavigationProps {
    items: BreadcrumbItem[];
    separator?: ReactNode;
    maxItems?: number;
    showHome?: boolean;
    homeIcon?: ReactNode;
    onItemClick?: (item: BreadcrumbItem, index: number) => void;
}
export interface BreadcrumbItem {
    id: string;
    label: string;
    href?: string;
    current?: boolean;
    onClick?: (event: MouseEvent<HTMLElement>) => void;
}
export interface SearchBarProps extends BaseNavigationProps {
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
    onSearch?: (query: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    suggestions?: SearchSuggestion[];
    loading?: boolean;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'minimal' | 'rounded';
    showIcon?: boolean;
    clearable?: boolean;
}
export interface SearchSuggestion {
    id: string;
    text: string;
    category?: string;
    icon?: ReactNode;
    onClick?: () => void;
}
export interface UserMenuProps extends BaseNavigationProps {
    user: UserInfo;
    items: UserMenuItem[];
    avatarSrc?: string;
    showAvatar?: boolean;
    showName?: boolean;
    position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
    onItemClick?: (item: UserMenuItem) => void;
}
export interface UserInfo {
    id: string;
    name: string;
    email?: string;
    avatar?: string;
    role?: string;
}
export interface UserMenuItem extends NavigationItem {
    divider?: boolean;
    danger?: boolean;
}
export interface NavigationTheme {
    colors: {
        primary: string;
        secondary: string;
        background: string;
        text: string;
        textSecondary: string;
        border: string;
        hover: string;
        active: string;
        danger: string;
    };
    spacing: {
        xs: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
    };
    typography: {
        fontSize: {
            sm: string;
            md: string;
            lg: string;
        };
        fontWeight: {
            normal: string;
            medium: string;
            bold: string;
        };
    };
    shadows: {
        sm: string;
        md: string;
        lg: string;
    };
    borderRadius: {
        sm: string;
        md: string;
        lg: string;
    };
    transitions: {
        fast: string;
        normal: string;
        slow: string;
    };
}
export interface NavigationKeyboardEvent extends KeyboardEvent<HTMLElement> {
}
export interface NavigationMouseEvent extends MouseEvent<HTMLElement> {
}
export type NavigationPosition = 'top' | 'bottom' | 'left' | 'right';
export type NavigationSize = 'sm' | 'md' | 'lg';
export type NavigationVariant = 'default' | 'minimal' | 'bordered' | 'rounded';
//# sourceMappingURL=index.d.ts.map