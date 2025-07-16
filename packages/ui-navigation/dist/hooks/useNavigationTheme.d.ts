/**
 * useNavigationTheme Hook
 * 네비게이션 테마 관리
 */
import { NavigationTheme } from '../types';
import { getThemeStyles } from '../utils/navigationTheme';
export interface UseNavigationThemeOptions {
    defaultTheme?: Partial<NavigationTheme>;
    autoDetectDarkMode?: boolean;
    persistTheme?: boolean;
    storageKey?: string;
}
export interface UseNavigationThemeReturn {
    theme: NavigationTheme;
    isDarkMode: boolean;
    setTheme: (theme: Partial<NavigationTheme>) => void;
    toggleDarkMode: () => void;
    enableDarkMode: () => void;
    enableLightMode: () => void;
    resetTheme: () => void;
    getStyles: () => ReturnType<typeof getThemeStyles>;
    applyTheme: (element?: HTMLElement) => void;
    removeTheme: (element?: HTMLElement) => void;
}
export declare const useNavigationTheme: (options?: UseNavigationThemeOptions) => UseNavigationThemeReturn;
//# sourceMappingURL=useNavigationTheme.d.ts.map