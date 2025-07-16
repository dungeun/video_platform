/**
 * @company/ui-buttons - UI Buttons Module
 *
 * 초세분화된 버튼 전용 모듈
 * - 버튼 컴포넌트만 담당
 * - 다른 UI 요소와 완전히 분리
 * - 최소 의존성 원칙 적용
 *
 * @version 1.0.0
 * @author Enterprise AI Team
 */
export { Button, ButtonGroup, IconButton, FAB } from './components';
export type { BaseButtonProps, ButtonGroupProps, IconButtonProps, FABProps, ButtonSize, ButtonVariant, LoadingState, IconPosition, ButtonTheme } from './types';
export { useButtonClasses, useButtonGroupClasses, useFABClasses } from './hooks';
export { getButtonTheme, getButtonSizeStyle, getButtonVariantStyle, setButtonTheme } from './utils';
export declare const UI_BUTTONS_MODULE_INFO: {
    readonly name: "@company/ui-buttons";
    readonly version: "1.0.0";
    readonly description: "Ultra-Fine-Grained UI Button Components Module";
    readonly author: "Enterprise AI Team";
    readonly license: "MIT";
    readonly features: readonly ["Basic Button Component", "Button Groups", "Icon Buttons", "Floating Action Buttons", "Loading States", "Multiple Variants", "Accessibility Support", "TypeScript Support"];
    readonly dependencies: {
        readonly react: ">=16.8.0";
    };
};
//# sourceMappingURL=index.d.ts.map