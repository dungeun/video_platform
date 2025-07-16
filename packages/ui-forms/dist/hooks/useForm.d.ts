/**
 * @repo/ui-forms - useForm Hook
 *
 * 폼 상태 및 검증을 관리하는 메인 훅
 */
import { FieldValue, ValidationRule, FieldError, FormState, UseFormReturn } from '../types';
export interface UseFormOptions {
    initialValues?: Record<string, FieldValue>;
    validationRules?: Record<string, ValidationRule>;
    onSubmit: (values: Record<string, FieldValue>, formState: FormState) => void | Promise<void>;
    onValidate?: (values: Record<string, FieldValue>) => Record<string, string | FieldError>;
    validateOnChange?: boolean;
    validateOnBlur?: boolean;
    validateOnSubmit?: boolean;
}
/**
 * 폼 상태 및 검증을 관리하는 훅
 */
export declare const useForm: (options: UseFormOptions) => UseFormReturn;
//# sourceMappingURL=useForm.d.ts.map