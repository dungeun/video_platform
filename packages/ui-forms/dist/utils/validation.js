/**
 * @repo/ui-forms - Validation Utilities
 *
 * 폼 검증을 위한 유틸리티 함수들
 */
// ===== 기본 검증 함수들 =====
/**
 * 필수 값 검증
 */
export const validateRequired = (value) => {
    if (value === null || value === undefined)
        return false;
    if (typeof value === 'string')
        return value.trim().length > 0;
    if (typeof value === 'boolean')
        return true;
    if (typeof value === 'number')
        return !isNaN(value);
    if (Array.isArray(value))
        return value.length > 0;
    if (value instanceof File)
        return true;
    return true;
};
/**
 * 최소 길이 검증
 */
export const validateMinLength = (value, min) => {
    if (!value)
        return true; // 빈 값은 required에서 처리
    if (typeof value === 'string')
        return value.length >= min;
    if (Array.isArray(value))
        return value.length >= min;
    return true;
};
/**
 * 최대 길이 검증
 */
export const validateMaxLength = (value, max) => {
    if (!value)
        return true;
    if (typeof value === 'string')
        return value.length <= max;
    if (Array.isArray(value))
        return value.length <= max;
    return true;
};
/**
 * 최소값 검증
 */
export const validateMin = (value, min) => {
    if (!value)
        return true;
    if (typeof value === 'number')
        return value >= min;
    if (typeof value === 'string') {
        const num = parseFloat(value);
        return !isNaN(num) && num >= min;
    }
    return true;
};
/**
 * 최대값 검증
 */
export const validateMax = (value, max) => {
    if (!value)
        return true;
    if (typeof value === 'number')
        return value <= max;
    if (typeof value === 'string') {
        const num = parseFloat(value);
        return !isNaN(num) && num <= max;
    }
    return true;
};
/**
 * 패턴 검증
 */
export const validatePattern = (value, pattern) => {
    if (!value)
        return true;
    if (typeof value === 'string')
        return pattern.test(value);
    return true;
};
/**
 * 이메일 검증
 */
export const validateEmail = (value) => {
    if (!value)
        return true;
    if (typeof value !== 'string')
        return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
};
/**
 * URL 검증
 */
export const validateUrl = (value) => {
    if (!value)
        return true;
    if (typeof value !== 'string')
        return false;
    try {
        new URL(value);
        return true;
    }
    catch {
        return false;
    }
};
// ===== 메인 검증 함수 =====
/**
 * 단일 필드 검증
 */
export const validateField = (value, rules) => {
    // Required 검증
    if (rules.required && !validateRequired(value)) {
        return {
            type: 'required',
            message: 'This field is required'
        };
    }
    // 빈 값인 경우 나머지 검증 건너뛰기
    if (!validateRequired(value)) {
        return null;
    }
    // 최소 길이 검증
    if (rules.minLength && !validateMinLength(value, rules.minLength)) {
        return {
            type: 'minLength',
            message: `Minimum length is ${rules.minLength} characters`
        };
    }
    // 최대 길이 검증
    if (rules.maxLength && !validateMaxLength(value, rules.maxLength)) {
        return {
            type: 'maxLength',
            message: `Maximum length is ${rules.maxLength} characters`
        };
    }
    // 최소값 검증
    if (rules.min !== undefined && !validateMin(value, rules.min)) {
        return {
            type: 'min',
            message: `Minimum value is ${rules.min}`
        };
    }
    // 최대값 검증
    if (rules.max !== undefined && !validateMax(value, rules.max)) {
        return {
            type: 'max',
            message: `Maximum value is ${rules.max}`
        };
    }
    // 패턴 검증
    if (rules.pattern && !validatePattern(value, rules.pattern)) {
        return {
            type: 'pattern',
            message: 'Invalid format'
        };
    }
    // 이메일 검증
    if (rules.email && !validateEmail(value)) {
        return {
            type: 'email',
            message: 'Invalid email address'
        };
    }
    // URL 검증
    if (rules.url && !validateUrl(value)) {
        return {
            type: 'url',
            message: 'Invalid URL'
        };
    }
    // 커스텀 검증
    if (rules.custom) {
        const result = rules.custom(value);
        if (result !== true) {
            return {
                type: 'custom',
                message: typeof result === 'string' ? result : 'Invalid value'
            };
        }
    }
    return null;
};
/**
 * 여러 필드 검증
 */
export const validateFields = (values, rules) => {
    const errors = {};
    Object.keys(rules).forEach(fieldName => {
        const value = values[fieldName];
        const fieldRules = rules[fieldName];
        const error = validateField(value, fieldRules);
        if (error) {
            errors[fieldName] = error;
        }
    });
    return errors;
};
// ===== 유틸리티 함수들 =====
/**
 * 에러 메시지 가져오기
 */
export const getErrorMessage = (error) => {
    if (!error)
        return '';
    if (typeof error === 'string')
        return error;
    return error.message;
};
/**
 * 필드가 유효한지 확인
 */
export const isFieldValid = (error) => {
    return !error;
};
/**
 * 폼이 유효한지 확인
 */
export const isFormValid = (errors) => {
    return Object.keys(errors).length === 0;
};
/**
 * 필드 값 정규화
 */
export const normalizeFieldValue = (value) => {
    if (value === '')
        return undefined;
    if (value === null)
        return undefined;
    return value;
};
/**
 * 검증 규칙 병합
 */
export const mergeValidationRules = (...rules) => {
    return rules.reduce((merged, rule) => {
        if (!rule)
            return merged;
        return { ...merged, ...rule };
    }, {});
};
//# sourceMappingURL=validation.js.map