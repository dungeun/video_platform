/**
 * @company/ui-forms - useFieldState Hook
 *
 * 개별 필드의 상태를 관리하는 훅
 */
import { useState, useCallback } from 'react';
import { validateField, normalizeFieldValue } from '../utils';
/**
 * 개별 필드의 상태를 관리하는 훅
 */
export const useFieldState = (options) => {
    const { name, initialValue, validationRules, validateOnChange = false, validateOnBlur = true, onChange, onBlur, onValidate } = options;
    // ===== 상태 관리 =====
    const [value, setValue] = useState(initialValue);
    const [error, setError] = useState();
    const [touched, setTouched] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [validating, setValidating] = useState(false);
    // ===== 계산된 상태 =====
    const fieldState = {
        value,
        error,
        touched,
        dirty,
        validating
    };
    // ===== 검증 실행 =====
    const validate = useCallback(async (valueToValidate) => {
        const currentValue = valueToValidate !== undefined ? valueToValidate : value;
        setValidating(true);
        try {
            let fieldError = null;
            // 규칙 기반 검증
            if (validationRules) {
                fieldError = validateField(currentValue, validationRules);
            }
            // 커스텀 검증
            if (!fieldError && onValidate) {
                const customResult = onValidate(currentValue);
                if (customResult) {
                    fieldError = typeof customResult === 'string'
                        ? { type: 'custom', message: customResult }
                        : customResult;
                }
            }
            setError(fieldError || undefined);
            return !fieldError;
        }
        catch (err) {
            console.error('Field validation error:', err);
            setError({ type: 'validation', message: 'Validation failed' });
            return false;
        }
        finally {
            setValidating(false);
        }
    }, [value, validationRules, onValidate]);
    // ===== 값 변경 핸들러 =====
    const handleChange = useCallback((event) => {
        const newValue = event.target.type === 'checkbox'
            ? event.target.checked
            : event.target.value;
        const normalizedValue = normalizeFieldValue(newValue);
        setValue(normalizedValue);
        setDirty(normalizedValue !== initialValue);
        // 변경 시 검증
        if (validateOnChange) {
            validate(normalizedValue);
        }
        // 외부 onChange 호출
        onChange?.(normalizedValue, event);
    }, [initialValue, validateOnChange, validate, onChange]);
    // ===== 포커스 아웃 핸들러 =====
    const handleBlur = useCallback((event) => {
        setTouched(true);
        // 블러 시 검증
        if (validateOnBlur) {
            validate();
        }
        // 외부 onBlur 호출
        onBlur?.(event);
    }, [validateOnBlur, validate, onBlur]);
    // ===== 값 직접 설정 =====
    const updateValue = useCallback((newValue, shouldValidate = false) => {
        const normalizedValue = normalizeFieldValue(newValue);
        setValue(normalizedValue);
        setDirty(normalizedValue !== initialValue);
        if (shouldValidate) {
            validate(normalizedValue);
        }
    }, [initialValue, validate]);
    // ===== 에러 설정 =====
    const setFieldError = useCallback((newError) => {
        if (!newError) {
            setError(undefined);
        }
        else if (typeof newError === 'string') {
            setError({ type: 'custom', message: newError });
        }
        else {
            setError(newError);
        }
    }, []);
    // ===== 리셋 =====
    const reset = useCallback((newInitialValue) => {
        const resetValue = newInitialValue !== undefined ? newInitialValue : initialValue;
        setValue(resetValue);
        setError(undefined);
        setTouched(false);
        setDirty(false);
        setValidating(false);
    }, [initialValue]);
    // ===== 필드 Props 생성 =====
    const getFieldProps = useCallback(() => {
        return {
            name,
            value: value || '',
            onChange: handleChange,
            onBlur: handleBlur,
            error,
            touched,
            dirty
        };
    }, [name, value, handleChange, handleBlur, error, touched, dirty]);
    return {
        // 상태
        ...fieldState,
        // 액션
        updateValue,
        setError: setFieldError,
        reset,
        validate,
        // 헬퍼
        getFieldProps,
        // 이벤트 핸들러
        handleChange,
        handleBlur,
        // 계산된 값
        isValid: !error,
        isEmpty: !value || (typeof value === 'string' && value.trim() === ''),
        hasError: !!error
    };
};
//# sourceMappingURL=useFieldState.js.map