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

// ===== 타입 =====
export type {
  // 기본 타입
  BaseNavigationProps,
  NavigationItem,
  NavigationPosition,
  NavigationSize,
  NavigationVariant,
  NavigationKeyboardEvent,
  NavigationMouseEvent,
  
  // 메가 메뉴 타입
  MegaMenuProps,
  MegaMenuItem,
  MegaMenuColumn,
  
  // 슬라이드 메뉴 타입
  SlideMenuProps,
  
  // 모바일 네비게이션 타입
  MobileNavigationProps,
  
  // 브레드크럼 타입
  BreadcrumbProps,
  BreadcrumbItem,
  
  // 검색바 타입
  SearchBarProps,
  SearchSuggestion,
  
  // 사용자 메뉴 타입
  UserMenuProps,
  UserInfo,
  UserMenuItem,
  
  // 테마 타입
  NavigationTheme
} from './types';

// ===== 훅 =====
export {
  useNavigation,
  useMegaMenu,
  useSlideMenu,
  useMobileNavigation,
  useBreadcrumbs,
  useSearchBar,
  useUserMenu,
  useKeyboardNavigation,
  useNavigationTheme
} from './hooks';

// ===== 유틸리티 =====
export {
  // 네비게이션 헬퍼
  isNavigationItemActive,
  findActiveNavigationItem,
  flattenNavigationItems,
  generateBreadcrumbs,
  filterNavigationItems,
  getNavigationDepth,
  normalizeUrl,
  validateNavigationItem,
  groupNavigationItems,
  calculateNavigationPath,
  isMobileDevice,
  isTouchDevice,
  
  // 키보드 네비게이션
  NAVIGATION_KEYS,
  isNavigationKey,
  isArrowKey,
  isVerticalArrowKey,
  isHorizontalArrowKey,
  isActivationKey,
  getFocusableElements,
  getNextFocusableElement,
  getFirstFocusableElement,
  getLastFocusableElement,
  navigateCircular,
  navigateGrid,
  createFocusTrap,
  
  // 접근성
  ARIA_ROLES,
  manageFocus,
  getScreenReaderOnlyStyles,
  isHighContrastMode,
  isPrefersReducedMotion,
  
  // 테마
  getNavigationTheme,
  setNavigationTheme,
  enableDarkTheme,
  enableLightTheme,
  defaultNavigationTheme,
  darkNavigationTheme,
  getThemeStyles,
  applyThemeVariables
} from './utils';

// ===== 컴포넌트 (개발 중) =====
// 컴포넌트들은 TypeScript 컴파일 이슈로 인해 현재 개발 중입니다.
// 향후 업데이트에서 제공될 예정입니다.

// ===== 모듈 정보 =====
export const UI_NAVIGATION_MODULE_INFO = {
  name: '@repo/ui-navigation',
  version: '1.0.0',
  description: 'Ultra-Fine-Grained UI Navigation Components Module',
  author: 'Enterprise AI Team',
  license: 'MIT',
  status: 'In Development',
  features: [
    'Navigation State Management',
    'Keyboard Navigation Support',
    'Full Accessibility (ARIA)',
    'Theme Customization',
    'TypeScript Support',
    'Mobile-first Design',
    'Performance Optimized'
  ],
  planned_components: [
    'Mega Menu with Multi-column Support',
    'Slide Menu with Nested Navigation', 
    'Mobile Navigation with Touch Support',
    'Breadcrumbs with Overflow Handling',
    'Search Bar with Autocomplete',
    'User Menu with Profile Display'
  ],
  dependencies: {
    react: '>=16.8.0'
  },
  hooks: {
    useNavigation: 'Basic navigation state management',
    useMegaMenu: 'Mega menu state and interactions',
    useSlideMenu: 'Slide menu state management',
    useMobileNavigation: 'Mobile navigation state',
    useBreadcrumbs: 'Breadcrumb navigation logic',
    useSearchBar: 'Search functionality with suggestions',
    useUserMenu: 'User menu state management',
    useKeyboardNavigation: 'Keyboard navigation support',
    useNavigationTheme: 'Theme management and customization'
  },
  utilities: {
    navigationHelpers: 'Navigation item manipulation utilities',
    keyboardNavigation: 'Keyboard interaction utilities',
    accessibility: 'ARIA and accessibility utilities',
    navigationTheme: 'Theme management utilities'
  }
} as const;