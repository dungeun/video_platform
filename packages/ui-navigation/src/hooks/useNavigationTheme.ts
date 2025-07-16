/**
 * useNavigationTheme Hook
 * 네비게이션 테마 관리
 */

import { useState, useCallback, useEffect } from 'react';
import { NavigationTheme } from '../types';
import { 
  getNavigationTheme, 
  setNavigationTheme,
  defaultNavigationTheme,
  darkNavigationTheme,
  getThemeStyles
} from '../utils/navigationTheme';

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

const STORAGE_KEY = 'navigation-theme';
const DARK_MODE_KEY = 'navigation-dark-mode';

export const useNavigationTheme = (
  options: UseNavigationThemeOptions = {}
): UseNavigationThemeReturn => {
  const {
    defaultTheme,
    autoDetectDarkMode = true,
    persistTheme = true,
    storageKey = STORAGE_KEY
  } = options;
  
  const [theme, setThemeState] = useState<NavigationTheme>(() => {
    // 저장된 테마 로드
    if (persistTheme && typeof window !== 'undefined') {
      try {
        const savedTheme = localStorage.getItem(storageKey);
        if (savedTheme) {
          const parsed = JSON.parse(savedTheme);
          setNavigationTheme({ ...defaultNavigationTheme, ...defaultTheme, ...parsed });
          return getNavigationTheme();
        }
      } catch (error) {
        console.warn('Failed to load saved navigation theme:', error);
      }
    }
    
    // 기본 테마 적용
    const initialTheme = { ...defaultNavigationTheme, ...defaultTheme };
    setNavigationTheme(initialTheme);
    return getNavigationTheme();
  });
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // 저장된 다크 모드 설정 로드
    if (persistTheme && typeof window !== 'undefined') {
      const savedDarkMode = localStorage.getItem(DARK_MODE_KEY);
      if (savedDarkMode !== null) {
        return JSON.parse(savedDarkMode);
      }
    }
    
    // 자동 감지
    if (autoDetectDarkMode && typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    return false;
  });
  
  // 다크 모드 자동 감지
  useEffect(() => {
    if (!autoDetectDarkMode || typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // 사용자가 수동으로 설정하지 않은 경우에만 적용
      if (persistTheme) {
        const savedDarkMode = localStorage.getItem(DARK_MODE_KEY);
        if (savedDarkMode !== null) return;
      }
      
      setIsDarkMode(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [autoDetectDarkMode, persistTheme]);
  
  // 다크 모드 변경시 테마 업데이트
  useEffect(() => {
    const newTheme = isDarkMode ? darkNavigationTheme : defaultNavigationTheme;
    setNavigationTheme({ ...newTheme, ...defaultTheme });
    setThemeState(getNavigationTheme());
    
    // 다크 모드 설정 저장
    if (persistTheme && typeof window !== 'undefined') {
      localStorage.setItem(DARK_MODE_KEY, JSON.stringify(isDarkMode));
    }
  }, [isDarkMode, defaultTheme, persistTheme]);
  
  // 테마 설정
  const setTheme = useCallback((newTheme: Partial<NavigationTheme>) => {
    setNavigationTheme(newTheme);
    const updatedTheme = getNavigationTheme();
    setThemeState(updatedTheme);
    
    // 테마 저장
    if (persistTheme && typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(newTheme));
      } catch (error) {
        console.warn('Failed to save navigation theme:', error);
      }
    }
  }, [persistTheme, storageKey]);
  
  // 다크 모드 토글
  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev: boolean) => !prev);
  }, []);
  
  // 다크 모드 활성화
  const enableDarkMode = useCallback(() => {
    setIsDarkMode(true);
  }, []);
  
  // 라이트 모드 활성화
  const enableLightMode = useCallback(() => {
    setIsDarkMode(false);
  }, []);
  
  // 테마 초기화
  const resetTheme = useCallback(() => {
    const baseTheme = isDarkMode ? darkNavigationTheme : defaultNavigationTheme;
    const resetTheme = { ...baseTheme, ...defaultTheme };
    setNavigationTheme(resetTheme);
    setThemeState(getNavigationTheme());
    
    // 저장된 테마 제거
    if (persistTheme && typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
    }
  }, [isDarkMode, defaultTheme, persistTheme, storageKey]);
  
  // 스타일 객체 반환
  const getStyles = useCallback(() => {
    return getThemeStyles(theme);
  }, [theme]);
  
  // DOM 요소에 테마 적용
  const applyTheme = useCallback((element?: HTMLElement) => {
    const target = element || document.documentElement;
    
    // CSS 변수 적용
    Object.entries({
      '--nav-color-primary': theme.colors.primary,
      '--nav-color-secondary': theme.colors.secondary,
      '--nav-color-background': theme.colors.background,
      '--nav-color-text': theme.colors.text,
      '--nav-color-text-secondary': theme.colors.textSecondary,
      '--nav-color-border': theme.colors.border,
      '--nav-color-hover': theme.colors.hover,
      '--nav-color-active': theme.colors.active,
      '--nav-color-danger': theme.colors.danger,
      
      '--nav-spacing-xs': theme.spacing.xs,
      '--nav-spacing-sm': theme.spacing.sm,
      '--nav-spacing-md': theme.spacing.md,
      '--nav-spacing-lg': theme.spacing.lg,
      '--nav-spacing-xl': theme.spacing.xl,
      
      '--nav-font-size-sm': theme.typography.fontSize.sm,
      '--nav-font-size-md': theme.typography.fontSize.md,
      '--nav-font-size-lg': theme.typography.fontSize.lg,
      
      '--nav-font-weight-normal': theme.typography.fontWeight.normal,
      '--nav-font-weight-medium': theme.typography.fontWeight.medium,
      '--nav-font-weight-bold': theme.typography.fontWeight.bold,
      
      '--nav-shadow-sm': theme.shadows.sm,
      '--nav-shadow-md': theme.shadows.md,
      '--nav-shadow-lg': theme.shadows.lg,
      
      '--nav-border-radius-sm': theme.borderRadius.sm,
      '--nav-border-radius-md': theme.borderRadius.md,
      '--nav-border-radius-lg': theme.borderRadius.lg,
      
      '--nav-transition-fast': theme.transitions.fast,
      '--nav-transition-normal': theme.transitions.normal,
      '--nav-transition-slow': theme.transitions.slow
    }).forEach(([property, value]) => {
      target.style.setProperty(property, value);
    });
    
    // 다크 모드 클래스 적용
    if (isDarkMode) {
      target.classList.add('navigation-dark');
      target.classList.remove('navigation-light');
    } else {
      target.classList.add('navigation-light');
      target.classList.remove('navigation-dark');
    }
  }, [theme, isDarkMode]);
  
  // DOM 요소에서 테마 제거
  const removeTheme = useCallback((element?: HTMLElement) => {
    const target = element || document.documentElement;
    
    // CSS 변수 제거
    const properties = [
      '--nav-color-primary',
      '--nav-color-secondary',
      '--nav-color-background',
      '--nav-color-text',
      '--nav-color-text-secondary',
      '--nav-color-border',
      '--nav-color-hover',
      '--nav-color-active',
      '--nav-color-danger',
      '--nav-spacing-xs',
      '--nav-spacing-sm',
      '--nav-spacing-md',
      '--nav-spacing-lg',
      '--nav-spacing-xl',
      '--nav-font-size-sm',
      '--nav-font-size-md',
      '--nav-font-size-lg',
      '--nav-font-weight-normal',
      '--nav-font-weight-medium',
      '--nav-font-weight-bold',
      '--nav-shadow-sm',
      '--nav-shadow-md',
      '--nav-shadow-lg',
      '--nav-border-radius-sm',
      '--nav-border-radius-md',
      '--nav-border-radius-lg',
      '--nav-transition-fast',
      '--nav-transition-normal',
      '--nav-transition-slow'
    ];
    
    properties.forEach(property => {
      target.style.removeProperty(property);
    });
    
    // 클래스 제거
    target.classList.remove('navigation-dark', 'navigation-light');
  }, []);
  
  // 초기 테마 적용
  useEffect(() => {
    applyTheme();
  }, [applyTheme]);
  
  return {
    theme,
    isDarkMode,
    setTheme,
    toggleDarkMode,
    enableDarkMode,
    enableLightMode,
    resetTheme,
    getStyles,
    applyTheme,
    removeTheme
  };
};