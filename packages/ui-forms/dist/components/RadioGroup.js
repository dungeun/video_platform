import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @company/ui-forms - RadioGroup Component
 *
 * 라디오 버튼 그룹을 위한 컴포넌트
 */
import { useState } from 'react';
import { useFormClasses } from '../hooks';
/**
 * 라디오 그룹 컴포넌트
 */
export const RadioGroup = ({ name, value, defaultValue, disabled = false, readOnly = false, required = false, size = 'medium', variant = 'default', className = '', style, options = [], direction = 'vertical', onChange, onBlur, onFocus, 'data-testid': testId, ...props }) => {
    const [focused, setFocused] = useState(false);
    // 에러 prop 추출
    const { error, ...restProps } = props;
    // 검증 상태 결정
    const validationState = error ? 'invalid' : undefined;
    // CSS 클래스 생성
    const classes = useFormClasses('radio-group', {
        size,
        variant,
        validationState,
        disabled,
        readOnly,
        focused,
        className
    });
    // 이벤트 핸들러
    const handleChange = (optionValue, event) => {
        if (!disabled && !readOnly) {
            onChange?.(optionValue, event);
        }
    };
    const handleFocus = (event) => {
        setFocused(true);
        onFocus?.(event);
    };
    const handleBlur = (event) => {
        setFocused(false);
        onBlur?.(event);
    };
    return (_jsx("div", { className: `${classes} radio-group--${direction}`, style: style, role: "radiogroup", "data-testid": testId, ...restProps, children: options.map((option, index) => {
            const optionId = `${name}-option-${index}`;
            const isChecked = value === option.value;
            const isDisabled = disabled || option.disabled;
            return (_jsxs("label", { htmlFor: optionId, className: `radio-option ${isDisabled ? 'radio-option--disabled' : ''} ${isChecked ? 'radio-option--checked' : ''}`, children: [_jsxs("span", { className: "radio-option__wrapper", children: [_jsx("input", { id: optionId, type: "radio", name: name, value: option.value, checked: isChecked, defaultChecked: defaultValue === option.value, disabled: isDisabled, readOnly: readOnly, required: required, className: "radio-option__input", onChange: (event) => handleChange(option.value, event), onFocus: handleFocus, onBlur: handleBlur }), _jsx("span", { className: "radio-option__indicator", children: isChecked && _jsx("span", { className: "radio-option__dot" }) })] }), _jsx("span", { className: "radio-option__label", children: option.label })] }, option.value));
        }) }));
};
//# sourceMappingURL=RadioGroup.js.map