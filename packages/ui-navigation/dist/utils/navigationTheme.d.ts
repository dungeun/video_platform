/**
 * Navigation Theme Utilities
 * 네비게이션 테마 관리 유틸리티
 */
import { NavigationTheme } from '../types';
export declare const defaultNavigationTheme: NavigationTheme;
export declare const darkNavigationTheme: NavigationTheme;
/**
 * 현재 네비게이션 테마 반환
 */
export declare const getNavigationTheme: () => NavigationTheme;
/**
 * 네비게이션 테마 설정
 */
export declare const setNavigationTheme: (theme: Partial<NavigationTheme>) => void;
/**
 * 다크 테마로 전환
 */
export declare const enableDarkTheme: () => void;
/**
 * 라이트 테마로 전환
 */
export declare const enableLightTheme: () => void;
/**
 * 테마 기반 스타일 생성
 */
export declare const getThemeStyles: (theme?: NavigationTheme) => {
    base: {
        fontFamily: string;
        transition: string;
    };
    container: {
        backgroundColor: string;
        color: string;
        border: string;
    };
    item: {
        padding: string;
        borderRadius: string;
        transition: string;
        cursor: string;
    };
    itemHover: {
        backgroundColor: string;
    };
    itemActive: {
        backgroundColor: string;
        color: string;
    };
    itemDisabled: {
        opacity: number;
        cursor: string;
    };
    itemDanger: {
        color: string;
    };
    shadow: {
        small: {
            boxShadow: string;
        };
        medium: {
            boxShadow: string;
        };
        large: {
            boxShadow: string;
        };
    };
};
/**
 * CSS 변수로 테마 적용
 */
export declare const applyThemeVariables: (theme?: NavigationTheme) => string;
//# sourceMappingURL=navigationTheme.d.ts.map