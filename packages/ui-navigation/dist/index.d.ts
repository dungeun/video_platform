/**
 * @repo/ui-navigation - UI Navigation Module
 *
 * 초세분화된 네비게이션 전용 모듈
 * - 네비게이션 컴포넌트만 담당
 * - 다른 UI 요소와 완전히 분리
 * - 최소 의존성 원칙 적용
 *
 * @version 1.0.0
 * @author Enterprise AI Team
 */
export type { BaseNavigationProps, NavigationItem, NavigationPosition, NavigationSize, NavigationVariant, NavigationKeyboardEvent, NavigationMouseEvent, MegaMenuProps, MegaMenuItem, MegaMenuColumn, SlideMenuProps, MobileNavigationProps, BreadcrumbProps, BreadcrumbItem, SearchBarProps, SearchSuggestion, UserMenuProps, UserInfo, UserMenuItem, NavigationTheme } from './types';
export { useNavigation, useMegaMenu, useSlideMenu, useMobileNavigation, useBreadcrumbs, useSearchBar, useUserMenu, useKeyboardNavigation, useNavigationTheme } from './hooks';
export { isNavigationItemActive, findActiveNavigationItem, flattenNavigationItems, generateBreadcrumbs, filterNavigationItems, getNavigationDepth, normalizeUrl, validateNavigationItem, groupNavigationItems, calculateNavigationPath, isMobileDevice, isTouchDevice, NAVIGATION_KEYS, isNavigationKey, isArrowKey, isVerticalArrowKey, isHorizontalArrowKey, isActivationKey, getFocusableElements, getNextFocusableElement, getFirstFocusableElement, getLastFocusableElement, navigateCircular, navigateGrid, createFocusTrap, ARIA_ROLES, manageFocus, getScreenReaderOnlyStyles, isHighContrastMode, isPrefersReducedMotion, getNavigationTheme, setNavigationTheme, enableDarkTheme, enableLightTheme, defaultNavigationTheme, darkNavigationTheme, getThemeStyles, applyThemeVariables } from './utils';
export declare const UI_NAVIGATION_MODULE_INFO: {
    readonly name: "@repo/ui-navigation";
    readonly version: "1.0.0";
    readonly description: "Ultra-Fine-Grained UI Navigation Components Module";
    readonly author: "Enterprise AI Team";
    readonly license: "MIT";
    readonly status: "In Development";
    readonly features: readonly ["Navigation State Management", "Keyboard Navigation Support", "Full Accessibility (ARIA)", "Theme Customization", "TypeScript Support", "Mobile-first Design", "Performance Optimized"];
    readonly planned_components: readonly ["Mega Menu with Multi-column Support", "Slide Menu with Nested Navigation", "Mobile Navigation with Touch Support", "Breadcrumbs with Overflow Handling", "Search Bar with Autocomplete", "User Menu with Profile Display"];
    readonly dependencies: {
        readonly react: ">=16.8.0";
    };
    readonly hooks: {
        readonly useNavigation: "Basic navigation state management";
        readonly useMegaMenu: "Mega menu state and interactions";
        readonly useSlideMenu: "Slide menu state management";
        readonly useMobileNavigation: "Mobile navigation state";
        readonly useBreadcrumbs: "Breadcrumb navigation logic";
        readonly useSearchBar: "Search functionality with suggestions";
        readonly useUserMenu: "User menu state management";
        readonly useKeyboardNavigation: "Keyboard navigation support";
        readonly useNavigationTheme: "Theme management and customization";
    };
    readonly utilities: {
        readonly navigationHelpers: "Navigation item manipulation utilities";
        readonly keyboardNavigation: "Keyboard interaction utilities";
        readonly accessibility: "ARIA and accessibility utilities";
        readonly navigationTheme: "Theme management utilities";
    };
};
//# sourceMappingURL=index.d.ts.map