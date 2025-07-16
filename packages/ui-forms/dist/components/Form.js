import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @repo/ui-forms - Form Component
 *
 * 폼 제출과 검증을 관리하는 메인 폼 컴포넌트
 */
import { createContext, useContext } from 'react';
import { useForm } from '../hooks';
// ===== 폼 컨텍스트 =====
const FormContext = createContext(null);
/**
 * 폼 컨텍스트 훅
 */
export const useFormContext = () => {
    const context = useContext(FormContext);
    if (!context) {
        throw new Error('useFormContext must be used within a Form component');
    }
    return context;
};
/**
 * 폼 컴포넌트
 * 폼 상태를 관리하고 자식 컴포넌트들에게 컨텍스트를 제공
 */
export const Form = ({ initialValues, validationRules, onSubmit, onValidate, children, className = '', noValidate = true, autoComplete = 'off' }) => {
    // 폼 상태 관리
    const formMethods = useForm({
        initialValues,
        validationRules,
        onSubmit,
        onValidate,
        validateOnChange: false,
        validateOnBlur: true,
        validateOnSubmit: true
    });
    // 폼 제출 핸들러
    const handleSubmit = (event) => {
        event.preventDefault();
        formMethods.submit();
    };
    return (_jsx(FormContext.Provider, { value: formMethods, children: _jsx("form", { className: `form ${className}`.trim(), onSubmit: handleSubmit, noValidate: noValidate, autoComplete: autoComplete, children: children }) }));
};
//# sourceMappingURL=Form.js.map