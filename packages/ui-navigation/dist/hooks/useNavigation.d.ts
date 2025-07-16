/**
 * useNavigation Hook
 * 기본 네비게이션 상태 관리
 */
import { NavigationItem } from '../types';
export interface UseNavigationOptions {
    items: NavigationItem[];
    currentPath?: string;
    onItemClick?: (item: NavigationItem) => void;
    autoDetectActive?: boolean;
}
export interface UseNavigationReturn {
    items: NavigationItem[];
    activeItem: NavigationItem | null;
    setActiveItem: (item: NavigationItem | null) => void;
    handleItemClick: (item: NavigationItem) => void;
    isItemActive: (item: NavigationItem) => boolean;
    getItemById: (id: string) => NavigationItem | null;
}
export declare const useNavigation: (options: UseNavigationOptions) => UseNavigationReturn;
//# sourceMappingURL=useNavigation.d.ts.map