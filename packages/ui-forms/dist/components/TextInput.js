import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @company/ui-forms - TextInput Component
 *
 * 텍스트 입력을 위한 기본 입력 컴포넌트
 */
import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { useFormClasses } from '../hooks';
import { getInputStyle } from '../utils';
/**
 * 텍스트 입력 컴포넌트
 */
export const TextInput = forwardRef(({ name, type = 'text', value, defaultValue, placeholder, disabled = false, readOnly = false, required = false, size = 'medium', variant = 'default', className = '', style, autoComplete, autoFocus = false, maxLength, minLength, pattern, spellCheck, prefix, suffix, onChange, onBlur, onFocus, 'data-testid': testId, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const inputRef = useRef(null);
    // ref 전달
    useImperativeHandle(ref, () => inputRef.current, []);
    // 에러 prop 추출
    const { error, ...restProps } = props;
    // 검증 상태 결정
    const validationState = error ? 'invalid' : undefined;
    // CSS 클래스 생성
    const classes = useFormClasses('text-input', {
        size,
        variant,
        validationState,
        disabled,
        readOnly,
        focused,
        className
    });
    // 인라인 스타일 생성
    const inputStyle = {
        ...getInputStyle(size, variant, validationState, disabled, readOnly, focused),
        ...style
    };
    // 이벤트 핸들러
    const handleFocus = (event) => {
        setFocused(true);
        onFocus?.(event);
    };
    const handleBlur = (event) => {
        setFocused(false);
        onBlur?.(event);
    };
    // 래퍼가 필요한지 확인 (prefix/suffix가 있는 경우)
    const hasWrapper = prefix || suffix;
    // 입력 요소
    const inputElement = (_jsx("input", { ref: inputRef, type: type, name: name, value: value, defaultValue: defaultValue, placeholder: placeholder, disabled: disabled, readOnly: readOnly, required: required, autoComplete: autoComplete, autoFocus: autoFocus, maxLength: maxLength, minLength: minLength, pattern: pattern, spellCheck: spellCheck, className: hasWrapper ? 'text-input__input' : classes, style: hasWrapper ? undefined : inputStyle, onChange: onChange, onFocus: handleFocus, onBlur: handleBlur, "data-testid": testId, ...restProps }));
    // prefix/suffix가 있는 경우 래퍼 사용
    if (hasWrapper) {
        return (_jsxs("div", { className: classes, style: inputStyle, children: [prefix && (_jsx("div", { className: "text-input__prefix", children: prefix })), inputElement, suffix && (_jsx("div", { className: "text-input__suffix", children: suffix }))] }));
    }
    return inputElement;
});
//# sourceMappingURL=TextInput.js.map