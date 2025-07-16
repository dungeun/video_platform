/**
 * @company/ui-forms - useFormClasses Hook
 *
 * 폼 컴포넌트의 CSS 클래스를 생성하는 훅
 */
import { FormSize, FormVariant, ValidationState } from '../types';
export interface UseFormClassesOptions {
    size?: FormSize;
    variant?: FormVariant;
    validationState?: ValidationState;
    disabled?: boolean;
    readOnly?: boolean;
    focused?: boolean;
    className?: string;
}
/**
 * 폼 입력 컴포넌트의 CSS 클래스를 생성하는 훅
 */
export declare const useFormClasses: (baseClass: string, options?: UseFormClassesOptions) => string;
//# sourceMappingURL=useFormClasses.d.ts.map