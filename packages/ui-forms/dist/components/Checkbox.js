import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @repo/ui-forms - Checkbox Component
 *
 * 체크박스 입력을 위한 컴포넌트
 */
import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { useFormClasses } from '../hooks';
/**
 * 체크박스 컴포넌트
 */
export const Checkbox = forwardRef(({ name, checked, defaultChecked, indeterminate = false, disabled = false, readOnly = false, required = false, size = 'medium', variant = 'default', className = '', style, label, onChange, onBlur, onFocus, 'data-testid': testId, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const checkboxRef = useRef(null);
    // ref 전달
    useImperativeHandle(ref, () => checkboxRef.current, []);
    // indeterminate 속성 설정
    React.useEffect(() => {
        if (checkboxRef.current) {
            checkboxRef.current.indeterminate = indeterminate;
        }
    }, [indeterminate]);
    // 에러 prop 추출
    const { error, ...restProps } = props;
    // 검증 상태 결정
    const validationState = error ? 'invalid' : undefined;
    // CSS 클래스 생성
    const classes = useFormClasses('checkbox', {
        size,
        variant,
        validationState,
        disabled,
        readOnly,
        focused,
        className
    });
    // 이벤트 핸들러
    const handleFocus = (event) => {
        setFocused(true);
        onFocus?.(event);
    };
    const handleBlur = (event) => {
        setFocused(false);
        onBlur?.(event);
    };
    const handleChange = (event) => {
        if (!disabled && !readOnly) {
            onChange?.(event.target.checked, event);
        }
    };
    const handleLabelClick = () => {
        if (!disabled && !readOnly && checkboxRef.current) {
            checkboxRef.current.click();
        }
    };
    // 체크박스 요소
    const checkboxElement = (_jsx("input", { ref: checkboxRef, type: "checkbox", name: name, checked: checked, defaultChecked: defaultChecked, disabled: disabled, readOnly: readOnly, required: required, className: "checkbox__input", style: style, onChange: handleChange, onFocus: handleFocus, onBlur: handleBlur, "data-testid": testId, ...restProps }));
    // 커스텀 체크박스 인디케이터
    const checkboxIndicator = (_jsx("span", { className: "checkbox__indicator", children: indeterminate ? (_jsx("span", { className: "checkbox__indeterminate", children: "-" })) : checked ? (_jsx("span", { className: "checkbox__check", children: "\u2713" })) : null }));
    return (_jsxs("label", { className: classes, children: [_jsxs("span", { className: "checkbox__wrapper", children: [checkboxElement, checkboxIndicator] }), label && (_jsx("span", { className: "checkbox__label", onClick: handleLabelClick, children: label }))] }));
});
//# sourceMappingURL=Checkbox.js.map