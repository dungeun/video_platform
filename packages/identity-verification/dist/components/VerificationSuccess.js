"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationSuccess = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const formatters_1 = require("../utils/formatters");
/**
 * 본인인증 성공 화면 컴포넌트
 */
const VerificationSuccess = ({ identity, onClose, className = '' }) => {
    return ((0, jsx_runtime_1.jsx)("div", { className: `verification-success ${className}`, children: (0, jsx_runtime_1.jsxs)("div", { className: "text-center py-8", children: [(0, jsx_runtime_1.jsx)("div", { className: "inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4", children: (0, jsx_runtime_1.jsx)("svg", { className: "w-12 h-12 text-green-500", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: (0, jsx_runtime_1.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) }) }), (0, jsx_runtime_1.jsx)("h3", { className: "text-2xl font-bold text-gray-800 mb-2", children: "\uBCF8\uC778\uC778\uC99D \uC644\uB8CC" }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-600 mb-6", children: "\uBCF8\uC778\uC778\uC99D\uC774 \uC131\uACF5\uC801\uC73C\uB85C \uC644\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4." }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-gray-50 rounded-lg p-6 max-w-md mx-auto mb-6", children: [(0, jsx_runtime_1.jsx)("h4", { className: "text-lg font-semibold text-gray-800 mb-4", children: "\uC778\uC99D \uC815\uBCF4" }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-3 text-left", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-gray-600", children: "\uC774\uB984" }), (0, jsx_runtime_1.jsx)("span", { className: "font-medium text-gray-800", children: (0, formatters_1.maskName)(identity.name) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-gray-600", children: "\uC0DD\uB144\uC6D4\uC77C" }), (0, jsx_runtime_1.jsxs)("span", { className: "font-medium text-gray-800", children: [identity.birthDate.substring(0, 4), ".", identity.birthDate.substring(4, 6), ".", identity.birthDate.substring(6, 8)] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-gray-600", children: "\uC131\uBCC4" }), (0, jsx_runtime_1.jsx)("span", { className: "font-medium text-gray-800", children: identity.gender === 'M' ? '남성' : '여성' })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-gray-600", children: "\uD734\uB300\uD3F0 \uBC88\uD638" }), (0, jsx_runtime_1.jsx)("span", { className: "font-medium text-gray-800", children: (0, formatters_1.maskPhoneNumber)(identity.phoneNumber) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-gray-600", children: "\uD1B5\uC2E0\uC0AC" }), (0, jsx_runtime_1.jsx)("span", { className: "font-medium text-gray-800", children: identity.carrier })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-gray-600", children: "\uC778\uC99D \uC218\uB2E8" }), (0, jsx_runtime_1.jsx)("span", { className: "font-medium text-gray-800", children: getVerificationMethodName(identity.verificationMethod) })] }), identity.isAdult && ((0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-gray-600", children: "\uC131\uC778 \uC778\uC99D" }), (0, jsx_runtime_1.jsx)("span", { className: "font-medium text-green-600", children: "\uC644\uB8CC" })] }))] })] }), (0, jsx_runtime_1.jsxs)("p", { className: "text-sm text-gray-500 mb-6", children: ["\uC778\uC99D \uC2DC\uAC04: ", identity.verifiedAt.toLocaleString('ko-KR')] }), (0, jsx_runtime_1.jsx)("button", { onClick: onClose, className: "px-8 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors", children: "\uD655\uC778" })] }) }));
};
exports.VerificationSuccess = VerificationSuccess;
/**
 * 인증 수단 이름 반환
 */
function getVerificationMethodName(method) {
    const methodNames = {
        'PASS': 'PASS 인증',
        'MOBILE_CARRIER': '휴대폰 인증',
        'KAKAO': '카카오 인증',
        'NAVER': '네이버 인증',
        'TOSS': '토스 인증',
        'PAYCO': '페이코 인증',
        'KB': 'KB국민은행 인증'
    };
    return methodNames[method] || method;
}
//# sourceMappingURL=VerificationSuccess.js.map