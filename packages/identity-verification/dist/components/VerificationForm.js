"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationForm = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const types_1 = require("../types");
const validators_1 = require("../utils/validators");
const formatters_1 = require("../utils/formatters");
/**
 * 본인인증 정보 입력 폼
 */
const VerificationForm = ({ method, data, onChange, onSubmit, onBack, onCancel }) => {
    const [errors, setErrors] = (0, react_1.useState)({});
    const [touched, setTouched] = (0, react_1.useState)({});
    /**
     * 입력 필드 변경 처리
     */
    const handleChange = (0, react_1.useCallback)((field, value) => {
        onChange({ [field]: value });
        // 터치된 필드 표시
        setTouched(prev => ({ ...prev, [field]: true }));
        // 에러 초기화
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    }, [onChange, errors]);
    /**
     * 휴대폰 번호 변경 처리
     */
    const handlePhoneChange = (0, react_1.useCallback)((e) => {
        const formatted = (0, formatters_1.formatPhoneNumber)(e.target.value);
        handleChange('phoneNumber', formatted);
    }, [handleChange]);
    /**
     * 생년월일 변경 처리
     */
    const handleBirthDateChange = (0, react_1.useCallback)((e) => {
        const formatted = (0, formatters_1.formatBirthDate)(e.target.value);
        handleChange('birthDate', formatted);
    }, [handleChange]);
    /**
     * 폼 제출 처리
     */
    const handleSubmit = (0, react_1.useCallback)((e) => {
        e.preventDefault();
        // 폼 검증
        const validationErrors = (0, validators_1.validateForm)(data);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            // 모든 필드를 터치된 것으로 표시
            const allTouched = Object.keys(data).reduce((acc, key) => ({
                ...acc,
                [key]: true
            }), {});
            setTouched(allTouched);
            return;
        }
        onSubmit();
    }, [data, onSubmit]);
    return ((0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: "verification-form space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: ["\uC774\uB984 ", (0, jsx_runtime_1.jsx)("span", { className: "text-red-500", children: "*" })] }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: data.name || '', onChange: (e) => handleChange('name', e.target.value), className: `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${touched.name && errors.name ? 'border-red-500' : 'border-gray-300'}`, placeholder: "\uD64D\uAE38\uB3D9" }), touched.name && errors.name && ((0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-sm text-red-500", children: errors.name }))] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: ["\uC0DD\uB144\uC6D4\uC77C ", (0, jsx_runtime_1.jsx)("span", { className: "text-red-500", children: "*" })] }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: data.birthDate || '', onChange: handleBirthDateChange, className: `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${touched.birthDate && errors.birthDate ? 'border-red-500' : 'border-gray-300'}`, placeholder: "YYYYMMDD", maxLength: 8 }), touched.birthDate && errors.birthDate && ((0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-sm text-red-500", children: errors.birthDate }))] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\uC131\uBCC4" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex space-x-4", children: [(0, jsx_runtime_1.jsxs)("label", { className: "flex items-center", children: [(0, jsx_runtime_1.jsx)("input", { type: "radio", name: "gender", value: "M", checked: data.gender === 'M', onChange: () => handleChange('gender', 'M'), className: "mr-2" }), "\uB0A8\uC131"] }), (0, jsx_runtime_1.jsxs)("label", { className: "flex items-center", children: [(0, jsx_runtime_1.jsx)("input", { type: "radio", name: "gender", value: "F", checked: data.gender === 'F', onChange: () => handleChange('gender', 'F'), className: "mr-2" }), "\uC5EC\uC131"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: ["\uD734\uB300\uD3F0 \uBC88\uD638 ", (0, jsx_runtime_1.jsx)("span", { className: "text-red-500", children: "*" })] }), (0, jsx_runtime_1.jsx)("input", { type: "tel", value: data.phoneNumber || '', onChange: handlePhoneChange, className: `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${touched.phoneNumber && errors.phoneNumber ? 'border-red-500' : 'border-gray-300'}`, placeholder: "010-1234-5678", maxLength: 13 }), touched.phoneNumber && errors.phoneNumber && ((0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-sm text-red-500", children: errors.phoneNumber }))] }), method === types_1.VerificationMethod.MOBILE_CARRIER && ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: ["\uD1B5\uC2E0\uC0AC ", (0, jsx_runtime_1.jsx)("span", { className: "text-red-500", children: "*" })] }), (0, jsx_runtime_1.jsxs)("select", { value: data.carrier || '', onChange: (e) => handleChange('carrier', e.target.value), className: `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${touched.carrier && errors.carrier ? 'border-red-500' : 'border-gray-300'}`, children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "\uC120\uD0DD\uD558\uC138\uC694" }), (0, jsx_runtime_1.jsx)("option", { value: types_1.MobileCarrier.SKT, children: "SKT" }), (0, jsx_runtime_1.jsx)("option", { value: types_1.MobileCarrier.KT, children: "KT" }), (0, jsx_runtime_1.jsx)("option", { value: types_1.MobileCarrier.LGU, children: "LG U+" }), (0, jsx_runtime_1.jsx)("option", { value: types_1.MobileCarrier.MVNO, children: "\uC54C\uB730\uD3F0" })] }), touched.carrier && errors.carrier && ((0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-sm text-red-500", children: errors.carrier }))] })), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\uB0B4/\uC678\uAD6D\uC778" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex space-x-4", children: [(0, jsx_runtime_1.jsxs)("label", { className: "flex items-center", children: [(0, jsx_runtime_1.jsx)("input", { type: "radio", name: "nationality", value: "korean", checked: data.nationality === 'korean', onChange: () => handleChange('nationality', 'korean'), className: "mr-2" }), "\uB0B4\uAD6D\uC778"] }), (0, jsx_runtime_1.jsxs)("label", { className: "flex items-center", children: [(0, jsx_runtime_1.jsx)("input", { type: "radio", name: "nationality", value: "foreigner", checked: data.nationality === 'foreigner', onChange: () => handleChange('nationality', 'foreigner'), className: "mr-2" }), "\uC678\uAD6D\uC778"] })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "bg-gray-50 p-4 rounded-md", children: (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-600", children: "\uBCF8\uC778\uC778\uC99D\uC744 \uC9C4\uD589\uD558\uBA74 \uAC1C\uC778\uC815\uBCF4 \uC218\uC9D1 \uBC0F \uC774\uC6A9\uC5D0 \uB3D9\uC758\uD558\uB294 \uAC83\uC73C\uB85C \uAC04\uC8FC\uB429\uB2C8\uB2E4." }) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex space-x-3 pt-4", children: [onBack && ((0, jsx_runtime_1.jsx)("button", { type: "button", onClick: onBack, className: "flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50", children: "\uC774\uC804" })), (0, jsx_runtime_1.jsx)("button", { type: "submit", className: "flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600", children: "\uC778\uC99D\uD558\uAE30" }), onCancel && ((0, jsx_runtime_1.jsx)("button", { type: "button", onClick: onCancel, className: "flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50", children: "\uCDE8\uC18C" }))] })] }));
};
exports.VerificationForm = VerificationForm;
//# sourceMappingURL=VerificationForm.js.map