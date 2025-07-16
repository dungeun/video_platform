import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @repo/ui-buttons - Floating Action Button Component
 * 플로팅 액션 버튼 컴포넌트
 */
import { forwardRef } from 'react';
import { Button } from './Button';
import { useFABClasses } from '../hooks/useFABClasses';
/**
 * 플로팅 액션 버튼 컴포넌트
 */
export const FAB = forwardRef(({ size = 'md', extended = false, position = 'bottom-right', icon, className = '', children, ...props }, ref) => {
    const fabClasses = useFABClasses({
        size,
        extended,
        position,
        className
    });
    const buttonSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md';
    return (_jsx(Button, { ref: ref, size: buttonSize, variant: "primary", rounded: "full", shadow: "lg", className: fabClasses, icon: icon, iconPosition: extended && children ? 'left' : 'only', ...props, children: extended && children }));
});
FAB.displayName = 'FAB';
//# sourceMappingURL=FAB.js.map