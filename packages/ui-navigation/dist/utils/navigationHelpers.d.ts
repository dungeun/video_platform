/**
 * Navigation Helper Utilities
 * 네비게이션 관련 헬퍼 함수들
 */
import { NavigationItem, BreadcrumbItem } from '../types';
/**
 * 네비게이션 아이템 활성 상태 확인
 */
export declare const isNavigationItemActive: (item: NavigationItem, currentPath: string) => boolean;
/**
 * 네비게이션 아이템에서 활성 아이템 찾기
 */
export declare const findActiveNavigationItem: (items: NavigationItem[], currentPath: string) => NavigationItem | null;
/**
 * 네비게이션 아이템 플래튼 (중첩 구조를 평면으로)
 */
export declare const flattenNavigationItems: (items: NavigationItem[]) => NavigationItem[];
/**
 * 브레드크럼 경로 생성
 */
export declare const generateBreadcrumbs: (items: NavigationItem[], currentPath: string) => BreadcrumbItem[];
/**
 * 검색 결과 필터링
 */
export declare const filterNavigationItems: (items: NavigationItem[], query: string) => NavigationItem[];
/**
 * 네비게이션 아이템 깊이 계산
 */
export declare const getNavigationDepth: (items: NavigationItem[]) => number;
/**
 * URL 정규화
 */
export declare const normalizeUrl: (url: string) => string;
/**
 * 네비게이션 아이템 유효성 검사
 */
export declare const validateNavigationItem: (item: NavigationItem) => boolean;
/**
 * 네비게이션 아이템 그룹핑
 */
export declare const groupNavigationItems: (items: NavigationItem[], groupBy: (item: NavigationItem) => string) => Record<string, NavigationItem[]>;
/**
 * 네비게이션 경로 계산
 */
export declare const calculateNavigationPath: (items: NavigationItem[], targetId: string) => NavigationItem[];
/**
 * 모바일 여부 확인
 */
export declare const isMobileDevice: () => boolean;
/**
 * 터치 디바이스 여부 확인
 */
export declare const isTouchDevice: () => boolean;
//# sourceMappingURL=navigationHelpers.d.ts.map