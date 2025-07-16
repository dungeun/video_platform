/**
 * useBreadcrumbs Hook
 * 브레드크럼 상태 관리
 */
import { BreadcrumbItem, NavigationItem } from '../types';
export interface UseBreadcrumbsOptions {
    items?: BreadcrumbItem[];
    navigationItems?: NavigationItem[];
    currentPath?: string;
    maxItems?: number;
    showHome?: boolean;
    homeItem?: BreadcrumbItem;
    onItemClick?: (item: BreadcrumbItem, index: number) => void;
}
export interface UseBreadcrumbsReturn {
    breadcrumbs: BreadcrumbItem[];
    visibleBreadcrumbs: BreadcrumbItem[];
    collapsedCount: number;
    isCollapsed: boolean;
    showCollapsed: boolean;
    toggleCollapsed: () => void;
    handleItemClick: (item: BreadcrumbItem, index: number) => void;
    addBreadcrumb: (item: BreadcrumbItem) => void;
    removeBreadcrumb: (index: number) => void;
    clearBreadcrumbs: () => void;
    setBreadcrumbs: (items: BreadcrumbItem[]) => void;
}
export declare const useBreadcrumbs: (options: UseBreadcrumbsOptions) => UseBreadcrumbsReturn;
//# sourceMappingURL=useBreadcrumbs.d.ts.map