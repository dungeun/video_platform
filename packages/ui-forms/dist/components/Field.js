import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @company/ui-forms - Field Component
 *
 * 라벨, 힌트, 에러를 포함한 필드 래퍼 컴포넌트
 */
import React from 'react';
import { getErrorMessage } from '../utils';
/**
 * 폼 필드를 위한 래퍼 컴포넌트
 * 라벨, 힌트, 에러 메시지를 포함
 */
export const Field = ({ name, label, hint, error, required, children, className = '', labelClassName = '', hintClassName = '', errorClassName = '' }) => {
    const errorMessage = getErrorMessage(error);
    const fieldId = `field-${name}`;
    const hintId = hint ? `${fieldId}-hint` : undefined;
    const errorId = errorMessage ? `${fieldId}-error` : undefined;
    // 자식 컴포넌트에 추가 props 전달
    const childrenWithProps = React.Children.map(children, child => {
        if (React.isValidElement(child)) {
            return React.cloneElement(child, {
                id: fieldId,
                'aria-describedby': [hintId, errorId].filter(Boolean).join(' ') || undefined,
                'aria-invalid': !!errorMessage,
                'aria-required': required,
                ...child.props
            });
        }
        return child;
    });
    return (_jsxs("div", { className: `form-field ${className}`.trim(), children: [label && (_jsxs("label", { htmlFor: fieldId, className: `form-field__label ${required ? 'form-field__label--required' : ''} ${labelClassName}`.trim(), children: [label, required && _jsx("span", { className: "form-field__required-mark", "aria-hidden": "true", children: " *" })] })), _jsx("div", { className: "form-field__input", children: childrenWithProps }), hint && (_jsx("div", { id: hintId, className: `form-field__hint ${hintClassName}`.trim(), children: hint })), errorMessage && (_jsx("div", { id: errorId, className: `form-field__error ${errorClassName}`.trim(), role: "alert", "aria-live": "polite", children: errorMessage }))] }));
};
//# sourceMappingURL=Field.js.map