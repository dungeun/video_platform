"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationMethodSelector = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const types_1 = require("../types");
/**
 * 본인인증 수단 선택 컴포넌트
 */
const VerificationMethodSelector = ({ availableMethods, onSelect, onCancel }) => {
    const methodInfo = {
        [types_1.VerificationMethod.PASS]: {
            name: 'PASS 인증',
            description: '통신 3사 PASS 앱으로 간편하게 인증',
            icon: '📱',
            color: 'bg-blue-500'
        },
        [types_1.VerificationMethod.MOBILE_CARRIER]: {
            name: '휴대폰 인증',
            description: '휴대폰 번호로 본인인증',
            icon: '📞',
            color: 'bg-green-500'
        },
        [types_1.VerificationMethod.KAKAO]: {
            name: '카카오 인증',
            description: '카카오톡으로 간편 인증',
            icon: '💬',
            color: 'bg-yellow-500'
        },
        [types_1.VerificationMethod.NAVER]: {
            name: '네이버 인증',
            description: '네이버로 간편 인증',
            icon: '🟢',
            color: 'bg-green-600'
        },
        [types_1.VerificationMethod.TOSS]: {
            name: '토스 인증',
            description: '토스로 간편 인증',
            icon: '💳',
            color: 'bg-blue-600'
        },
        [types_1.VerificationMethod.PAYCO]: {
            name: '페이코 인증',
            description: '페이코로 간편 인증',
            icon: '🔴',
            color: 'bg-red-500'
        },
        [types_1.VerificationMethod.KB]: {
            name: 'KB국민은행 인증',
            description: 'KB국민은행 앱으로 인증',
            icon: '🏦',
            color: 'bg-yellow-600'
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "verification-method-selector", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-gray-600 mb-6", children: "\uBCF8\uC778\uC778\uC99D\uC744 \uC704\uD55C \uBC29\uBC95\uC744 \uC120\uD0DD\uD574\uC8FC\uC138\uC694." }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: availableMethods.map((method) => {
                    const info = methodInfo[method];
                    return ((0, jsx_runtime_1.jsx)("button", { onClick: () => onSelect(method), className: "p-4 border border-gray-200 rounded-lg hover:border-gray-400 hover:shadow-md transition-all duration-200 text-left", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-start space-x-3", children: [(0, jsx_runtime_1.jsx)("div", { className: `w-12 h-12 rounded-full ${info.color} flex items-center justify-center text-white text-xl`, children: info.icon }), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1", children: [(0, jsx_runtime_1.jsx)("h3", { className: "font-semibold text-gray-800", children: info.name }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-600 mt-1", children: info.description })] })] }) }, method));
                }) }), onCancel && ((0, jsx_runtime_1.jsx)("div", { className: "mt-6 text-center", children: (0, jsx_runtime_1.jsx)("button", { onClick: onCancel, className: "text-gray-500 hover:text-gray-700 underline", children: "\uCDE8\uC18C" }) }))] }));
};
exports.VerificationMethodSelector = VerificationMethodSelector;
//# sourceMappingURL=VerificationMethodSelector.js.map