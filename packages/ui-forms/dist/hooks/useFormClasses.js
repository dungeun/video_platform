/**
 * @company/ui-forms - useFormClasses Hook
 *
 * 폼 컴포넌트의 CSS 클래스를 생성하는 훅
 */
import { useMemo } from 'react';
import { getFormClasses } from '../utils';
/**
 * 폼 입력 컴포넌트의 CSS 클래스를 생성하는 훅
 */
export const useFormClasses = (baseClass, options = {}) => {
    const { size, variant, validationState, disabled, readOnly, focused, className } = options;
    const classes = useMemo(() => {
        return getFormClasses(baseClass, size, variant, validationState, disabled, readOnly, focused, className);
    }, [
        baseClass,
        size,
        variant,
        validationState,
        disabled,
        readOnly,
        focused,
        className
    ]);
    return classes;
};
//# sourceMappingURL=useFormClasses.js.map