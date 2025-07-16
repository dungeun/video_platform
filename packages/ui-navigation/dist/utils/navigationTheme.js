/**
 * Navigation Theme Utilities
 * 네비게이션 테마 관리 유틸리티
 */
// 기본 테마
export const defaultNavigationTheme = {
    colors: {
        primary: '#3b82f6',
        secondary: '#64748b',
        background: '#ffffff',
        text: '#1f2937',
        textSecondary: '#6b7280',
        border: '#e5e7eb',
        hover: '#f3f4f6',
        active: '#dbeafe',
        danger: '#ef4444'
    },
    spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem'
    },
    typography: {
        fontSize: {
            sm: '0.875rem',
            md: '1rem',
            lg: '1.125rem'
        },
        fontWeight: {
            normal: '400',
            medium: '500',
            bold: '600'
        }
    },
    shadows: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
    },
    borderRadius: {
        sm: '0.125rem',
        md: '0.375rem',
        lg: '0.5rem'
    },
    transitions: {
        fast: '150ms ease-in-out',
        normal: '200ms ease-in-out',
        slow: '300ms ease-in-out'
    }
};
// 다크 테마
export const darkNavigationTheme = {
    ...defaultNavigationTheme,
    colors: {
        primary: '#60a5fa',
        secondary: '#94a3b8',
        background: '#111827',
        text: '#f9fafb',
        textSecondary: '#d1d5db',
        border: '#374151',
        hover: '#1f2937',
        active: '#1e3a8a',
        danger: '#f87171'
    }
};
// 현재 테마 상태
let currentTheme = defaultNavigationTheme;
/**
 * 현재 네비게이션 테마 반환
 */
export const getNavigationTheme = () => {
    return currentTheme;
};
/**
 * 네비게이션 테마 설정
 */
export const setNavigationTheme = (theme) => {
    currentTheme = {
        ...currentTheme,
        ...theme,
        colors: { ...currentTheme.colors, ...theme.colors },
        spacing: { ...currentTheme.spacing, ...theme.spacing },
        typography: {
            ...currentTheme.typography,
            ...theme.typography,
            fontSize: { ...currentTheme.typography.fontSize, ...theme.typography?.fontSize },
            fontWeight: { ...currentTheme.typography.fontWeight, ...theme.typography?.fontWeight }
        },
        shadows: { ...currentTheme.shadows, ...theme.shadows },
        borderRadius: { ...currentTheme.borderRadius, ...theme.borderRadius },
        transitions: { ...currentTheme.transitions, ...theme.transitions }
    };
};
/**
 * 다크 테마로 전환
 */
export const enableDarkTheme = () => {
    setNavigationTheme(darkNavigationTheme);
};
/**
 * 라이트 테마로 전환
 */
export const enableLightTheme = () => {
    setNavigationTheme(defaultNavigationTheme);
};
/**
 * 테마 기반 스타일 생성
 */
export const getThemeStyles = (theme = currentTheme) => ({
    // 공통 스타일
    base: {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        transition: theme.transitions.normal
    },
    // 컨테이너 스타일
    container: {
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        border: `1px solid ${theme.colors.border}`
    },
    // 아이템 스타일
    item: {
        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
        borderRadius: theme.borderRadius.md,
        transition: theme.transitions.fast,
        cursor: 'pointer'
    },
    // 호버 스타일
    itemHover: {
        backgroundColor: theme.colors.hover
    },
    // 활성 스타일
    itemActive: {
        backgroundColor: theme.colors.active,
        color: theme.colors.primary
    },
    // 비활성 스타일
    itemDisabled: {
        opacity: 0.5,
        cursor: 'not-allowed'
    },
    // 위험 스타일
    itemDanger: {
        color: theme.colors.danger
    },
    // 그림자 스타일
    shadow: {
        small: { boxShadow: theme.shadows.sm },
        medium: { boxShadow: theme.shadows.md },
        large: { boxShadow: theme.shadows.lg }
    }
});
/**
 * CSS 변수로 테마 적용
 */
export const applyThemeVariables = (theme = currentTheme) => {
    return `
    --nav-color-primary: ${theme.colors.primary};
    --nav-color-secondary: ${theme.colors.secondary};
    --nav-color-background: ${theme.colors.background};
    --nav-color-text: ${theme.colors.text};
    --nav-color-text-secondary: ${theme.colors.textSecondary};
    --nav-color-border: ${theme.colors.border};
    --nav-color-hover: ${theme.colors.hover};
    --nav-color-active: ${theme.colors.active};
    --nav-color-danger: ${theme.colors.danger};
    
    --nav-spacing-xs: ${theme.spacing.xs};
    --nav-spacing-sm: ${theme.spacing.sm};
    --nav-spacing-md: ${theme.spacing.md};
    --nav-spacing-lg: ${theme.spacing.lg};
    --nav-spacing-xl: ${theme.spacing.xl};
    
    --nav-font-size-sm: ${theme.typography.fontSize.sm};
    --nav-font-size-md: ${theme.typography.fontSize.md};
    --nav-font-size-lg: ${theme.typography.fontSize.lg};
    
    --nav-font-weight-normal: ${theme.typography.fontWeight.normal};
    --nav-font-weight-medium: ${theme.typography.fontWeight.medium};
    --nav-font-weight-bold: ${theme.typography.fontWeight.bold};
    
    --nav-shadow-sm: ${theme.shadows.sm};
    --nav-shadow-md: ${theme.shadows.md};
    --nav-shadow-lg: ${theme.shadows.lg};
    
    --nav-border-radius-sm: ${theme.borderRadius.sm};
    --nav-border-radius-md: ${theme.borderRadius.md};
    --nav-border-radius-lg: ${theme.borderRadius.lg};
    
    --nav-transition-fast: ${theme.transitions.fast};
    --nav-transition-normal: ${theme.transitions.normal};
    --nav-transition-slow: ${theme.transitions.slow};
  `;
};
//# sourceMappingURL=navigationTheme.js.map