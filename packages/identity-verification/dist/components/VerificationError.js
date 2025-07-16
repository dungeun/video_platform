"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationError = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const types_1 = require("../types");
/**
 * 본인인증 오류 화면 컴포넌트
 */
const VerificationError = ({ error, onRetry, onCancel, className = '' }) => {
    const getErrorInfo = (code) => {
        switch (code) {
            case types_1.VerificationErrorCode.INVALID_REQUEST:
                return {
                    title: '잘못된 요청',
                    description: '입력하신 정보를 다시 확인해주세요.',
                    icon: '⚠️',
                    suggestions: [
                        '이름이 정확한지 확인해주세요.',
                        '생년월일 형식(YYYYMMDD)이 올바른지 확인해주세요.',
                        '휴대폰 번호가 정확한지 확인해주세요.'
                    ]
                };
            case types_1.VerificationErrorCode.INVALID_PHONE:
                return {
                    title: '휴대폰 번호 오류',
                    description: '올바른 휴대폰 번호를 입력해주세요.',
                    icon: '📱',
                    suggestions: [
                        '휴대폰 번호 형식을 확인해주세요.',
                        '현재 사용 중인 번호인지 확인해주세요.',
                        '통신사 정보가 정확한지 확인해주세요.'
                    ]
                };
            case types_1.VerificationErrorCode.INVALID_BIRTH_DATE:
                return {
                    title: '생년월일 오류',
                    description: '올바른 생년월일을 입력해주세요.',
                    icon: '📅',
                    suggestions: [
                        'YYYYMMDD 형식으로 입력해주세요.',
                        '예: 19900101'
                    ]
                };
            case types_1.VerificationErrorCode.INVALID_NAME:
                return {
                    title: '이름 오류',
                    description: '올바른 이름을 입력해주세요.',
                    icon: '👤',
                    suggestions: [
                        '실명을 정확히 입력해주세요.',
                        '특수문자나 숫자는 사용할 수 없습니다.'
                    ]
                };
            case types_1.VerificationErrorCode.VERIFICATION_FAILED:
                return {
                    title: '인증 실패',
                    description: '본인인증에 실패했습니다.',
                    icon: '❌',
                    suggestions: [
                        '입력하신 정보가 정확한지 다시 확인해주세요.',
                        '본인 명의의 휴대폰인지 확인해주세요.',
                        '다른 인증 수단을 시도해보세요.'
                    ]
                };
            case types_1.VerificationErrorCode.SESSION_EXPIRED:
                return {
                    title: '세션 만료',
                    description: '인증 시간이 초과되었습니다.',
                    icon: '⏰',
                    suggestions: [
                        '다시 인증을 시도해주세요.',
                        '인증은 5분 이내에 완료해주세요.'
                    ]
                };
            case types_1.VerificationErrorCode.SERVICE_UNAVAILABLE:
                return {
                    title: '서비스 일시 중단',
                    description: '일시적으로 서비스를 사용할 수 없습니다.',
                    icon: '🔧',
                    suggestions: [
                        '잠시 후 다시 시도해주세요.',
                        '다른 인증 수단을 이용해주세요.'
                    ]
                };
            case types_1.VerificationErrorCode.RATE_LIMIT_EXCEEDED:
                return {
                    title: '요청 제한 초과',
                    description: '너무 많은 인증 시도가 있었습니다.',
                    icon: '🚫',
                    suggestions: [
                        '잠시 후 다시 시도해주세요.',
                        '반복적인 실패 시 고객센터에 문의해주세요.'
                    ]
                };
            default:
                return {
                    title: '인증 오류',
                    description: error.message || '알 수 없는 오류가 발생했습니다.',
                    icon: '❓',
                    suggestions: [
                        '다시 시도해주세요.',
                        '문제가 지속되면 고객센터에 문의해주세요.'
                    ]
                };
        }
    };
    const errorInfo = getErrorInfo(error.code);
    return ((0, jsx_runtime_1.jsx)("div", { className: `verification-error ${className}`, children: (0, jsx_runtime_1.jsxs)("div", { className: "text-center py-8", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-6xl mb-4", children: errorInfo.icon }), (0, jsx_runtime_1.jsx)("h3", { className: "text-2xl font-bold text-red-600 mb-2", children: errorInfo.title }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-600 mb-6 max-w-md mx-auto", children: errorInfo.description }), errorInfo.suggestions.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "bg-gray-50 rounded-lg p-6 max-w-md mx-auto mb-6", children: [(0, jsx_runtime_1.jsx)("h4", { className: "text-sm font-semibold text-gray-700 mb-3", children: "\uD574\uACB0 \uBC29\uBC95" }), (0, jsx_runtime_1.jsx)("ul", { className: "text-sm text-gray-600 space-y-2 text-left", children: errorInfo.suggestions.map((suggestion, index) => ((0, jsx_runtime_1.jsxs)("li", { className: "flex items-start", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-blue-500 mr-2", children: "\u2022" }), (0, jsx_runtime_1.jsx)("span", { children: suggestion })] }, index))) })] })), (0, jsx_runtime_1.jsxs)("p", { className: "text-xs text-gray-500 mb-6", children: ["\uC624\uB958 \uCF54\uB4DC: ", error.code] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-center space-x-3", children: [onRetry && ((0, jsx_runtime_1.jsx)("button", { onClick: onRetry, className: "px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors", children: "\uB2E4\uC2DC \uC2DC\uB3C4" })), onCancel && ((0, jsx_runtime_1.jsx)("button", { onClick: onCancel, className: "px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors", children: "\uCDE8\uC18C" }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-8 text-sm text-gray-500", children: [(0, jsx_runtime_1.jsx)("p", { children: "\uBB38\uC81C\uAC00 \uACC4\uC18D\uB418\uB098\uC694?" }), (0, jsx_runtime_1.jsx)("a", { href: "#", className: "text-blue-500 hover:underline", children: "\uACE0\uAC1D\uC13C\uD130 \uBB38\uC758\uD558\uAE30" })] })] }) }));
};
exports.VerificationError = VerificationError;
//# sourceMappingURL=VerificationError.js.map