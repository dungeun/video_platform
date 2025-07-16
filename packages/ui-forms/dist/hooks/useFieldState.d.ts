/**
 * @company/ui-forms - useFieldState Hook
 *
 * 개별 필드의 상태를 관리하는 훅
 */
import { ChangeEvent, FocusEvent } from 'react';
import { FieldValue, ValidationRule, FieldError } from '../types';
export interface UseFieldStateOptions {
    name: string;
    initialValue?: FieldValue;
    validationRules?: ValidationRule;
    validateOnChange?: boolean;
    validateOnBlur?: boolean;
    onChange?: (value: FieldValue, event?: ChangeEvent<any>) => void;
    onBlur?: (event?: FocusEvent<any>) => void;
    onValidate?: (value: FieldValue) => string | FieldError | null;
}
/**
 * 개별 필드의 상태를 관리하는 훅
 */
export declare const useFieldState: (options: UseFieldStateOptions) => {
    updateValue: (newValue: FieldValue, shouldValidate?: boolean) => void;
    setError: (newError: string | FieldError | undefined) => void;
    reset: (newInitialValue?: FieldValue) => void;
    validate: (valueToValidate?: FieldValue) => Promise<boolean>;
    getFieldProps: () => {
        name: string;
        value: string | number | true | File | string[] | File[];
        onChange: (event: ChangeEvent<any>) => void;
        onBlur: (event: FocusEvent<any>) => void;
        error: FieldError | undefined;
        touched: boolean;
        dirty: boolean;
    };
    handleChange: (event: ChangeEvent<any>) => void;
    handleBlur: (event: FocusEvent<any>) => void;
    isValid: boolean;
    isEmpty: boolean;
    hasError: boolean;
    value: FieldValue;
    error?: FieldError;
    touched: boolean;
    dirty: boolean;
    validating: boolean;
};
//# sourceMappingURL=useFieldState.d.ts.map