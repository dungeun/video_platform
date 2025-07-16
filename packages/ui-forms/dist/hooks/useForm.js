/**
 * @company/ui-forms - useForm Hook
 *
 * 폼 상태 및 검증을 관리하는 메인 훅
 */
import { useState, useCallback, useRef } from 'react';
import { validateField, validateFields, normalizeFieldValue } from '../utils';
/**
 * 폼 상태 및 검증을 관리하는 훅
 */
export const useForm = (options) => {
    const { initialValues = {}, validationRules = {}, onSubmit, onValidate, validateOnChange = false, validateOnBlur = true, validateOnSubmit = true } = options;
    // ===== 상태 관리 =====
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [dirty, setDirty] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitCount, setSubmitCount] = useState(0);
    // 참조 값들
    const initialValuesRef = useRef(initialValues);
    const validationRulesRef = useRef(validationRules);
    // ===== 계산된 값들 =====
    const isValid = Object.keys(errors).length === 0;
    const formState = {
        values,
        errors,
        touched,
        dirty,
        isValid,
        isSubmitting,
        submitCount
    };
    // ===== 값 설정 =====
    const setValue = useCallback((name, value) => {
        const normalizedValue = normalizeFieldValue(value);
        setValues(prev => ({ ...prev, [name]: normalizedValue }));
        setDirty(prev => ({
            ...prev,
            [name]: normalizedValue !== initialValuesRef.current[name]
        }));
        // 변경 시 검증
        if (validateOnChange && validationRulesRef.current[name]) {
            const error = validateField(normalizedValue, validationRulesRef.current[name]);
            if (error) {
                setErrors(prev => ({ ...prev, [name]: error }));
            }
            else {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors[name];
                    return newErrors;
                });
            }
        }
    }, [validateOnChange]);
    // ===== 에러 관리 =====
    const setError = useCallback((name, error) => {
        const fieldError = typeof error === 'string'
            ? { type: 'custom', message: error }
            : error;
        setErrors(prev => ({ ...prev, [name]: fieldError }));
    }, []);
    const clearError = useCallback((name) => {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[name];
            return newErrors;
        });
    }, []);
    const clearErrors = useCallback(() => {
        setErrors({});
    }, []);
    // ===== 터치 상태 관리 =====
    const setTouchedField = useCallback((name, isTouched = true) => {
        setTouched(prev => ({ ...prev, [name]: isTouched }));
    }, []);
    // ===== 리셋 =====
    const reset = useCallback((newValues) => {
        const resetValues = newValues || initialValuesRef.current;
        setValues(resetValues);
        setErrors({});
        setTouched({});
        setDirty({});
        setIsSubmitting(false);
        setSubmitCount(0);
        initialValuesRef.current = resetValues;
    }, []);
    // ===== 검증 =====
    const validate = useCallback(async (fieldName) => {
        if (fieldName) {
            // 단일 필드 검증
            const value = values[fieldName];
            const rules = validationRulesRef.current[fieldName];
            if (rules) {
                const error = validateField(value, rules);
                if (error) {
                    setErrors(prev => ({ ...prev, [fieldName]: error }));
                    return false;
                }
                else {
                    setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors[fieldName];
                        return newErrors;
                    });
                    return true;
                }
            }
            return true;
        }
        else {
            // 전체 폼 검증
            let hasErrors = false;
            const newErrors = {};
            // 규칙 기반 검증
            const ruleErrors = validateFields(values, validationRulesRef.current);
            Object.assign(newErrors, ruleErrors);
            // 커스텀 검증
            if (onValidate) {
                try {
                    const customErrors = onValidate(values);
                    Object.entries(customErrors).forEach(([name, error]) => {
                        if (error) {
                            newErrors[name] = typeof error === 'string'
                                ? { type: 'custom', message: error }
                                : error;
                        }
                    });
                }
                catch (error) {
                    console.error('Custom validation error:', error);
                }
            }
            hasErrors = Object.keys(newErrors).length > 0;
            setErrors(newErrors);
            return !hasErrors;
        }
    }, [values, onValidate]);
    // ===== 제출 =====
    const submit = useCallback(async () => {
        setIsSubmitting(true);
        setSubmitCount(prev => prev + 1);
        try {
            // 제출 시 검증
            if (validateOnSubmit) {
                const isFormValid = await validate();
                if (!isFormValid) {
                    setIsSubmitting(false);
                    return;
                }
            }
            // 제출 실행
            await onSubmit(values, formState);
        }
        catch (error) {
            console.error('Form submission error:', error);
        }
        finally {
            setIsSubmitting(false);
        }
    }, [values, formState, onSubmit, validate, validateOnSubmit]);
    // ===== 필드 Props 생성 =====
    const getFieldProps = useCallback((name) => {
        return {
            name,
            value: values[name] || '',
            onChange: (event) => {
                const value = event.target.type === 'checkbox'
                    ? event.target.checked
                    : event.target.value;
                setValue(name, value);
            },
            onBlur: (event) => {
                setTouchedField(name, true);
                // 블러 시 검증
                if (validateOnBlur && validationRulesRef.current[name]) {
                    validate(name);
                }
            },
            error: errors[name],
            touched: touched[name] || false,
            dirty: dirty[name] || false
        };
    }, [values, errors, touched, dirty, setValue, setTouchedField, validate, validateOnBlur]);
    // ===== 반환 값 =====
    return {
        values,
        errors,
        touched,
        dirty,
        isValid,
        isSubmitting,
        submitCount,
        setValue,
        setError,
        clearError,
        clearErrors,
        setTouched: setTouchedField,
        reset,
        validate,
        submit,
        getFieldProps
    };
};
//# sourceMappingURL=useForm.js.map