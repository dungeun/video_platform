/**
 * @repo/ui-buttons - UI Buttons Module
 *
 * 초세분화된 버튼 전용 모듈
 * - 버튼 컴포넌트만 담당
 * - 다른 UI 요소와 완전히 분리
 * - 최소 의존성 원칙 적용
 *
 * @version 1.0.0
 * @author Enterprise AI Team
 */
// ===== 컴포넌트 =====
export { Button, ButtonGroup, IconButton, FAB } from './components';
// ===== 훅 =====
export { useButtonClasses, useButtonGroupClasses, useFABClasses } from './hooks';
// ===== 유틸리티 =====
export { getButtonTheme, getButtonSizeStyle, getButtonVariantStyle, setButtonTheme } from './utils';
// ===== 모듈 정보 =====
export const UI_BUTTONS_MODULE_INFO = {
    name: '@repo/ui-buttons',
    version: '1.0.0',
    description: 'Ultra-Fine-Grained UI Button Components Module',
    author: 'Enterprise AI Team',
    license: 'MIT',
    features: [
        'Basic Button Component',
        'Button Groups',
        'Icon Buttons',
        'Floating Action Buttons',
        'Loading States',
        'Multiple Variants',
        'Accessibility Support',
        'TypeScript Support'
    ],
    dependencies: {
        react: '>=16.8.0'
    }
};
//# sourceMappingURL=index.js.map