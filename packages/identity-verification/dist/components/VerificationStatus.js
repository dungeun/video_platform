"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationStatus = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const types_1 = require("../types");
/**
 * 본인인증 진행 상태 표시 컴포넌트
 */
const VerificationStatus = ({ status, onCancel, className = '' }) => {
    const [dots, setDots] = (0, react_1.useState)('');
    // 로딩 애니메이션
    (0, react_1.useEffect)(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 500);
        return () => clearInterval(interval);
    }, []);
    const statusInfo = {
        [types_1.VerificationStatus.IDLE]: {
            title: '대기 중',
            message: '본인인증을 시작해주세요.',
            icon: '⏳',
            color: 'text-gray-600'
        },
        [types_1.VerificationStatus.INITIALIZING]: {
            title: '초기화 중',
            message: '인증 서비스를 준비하고 있습니다.',
            icon: '🔧',
            color: 'text-blue-600'
        },
        [types_1.VerificationStatus.IN_PROGRESS]: {
            title: '인증 진행 중',
            message: '본인인증을 진행해주세요. 새 창이 열렸다면 해당 창에서 인증을 완료해주세요.',
            icon: '📱',
            color: 'text-blue-600'
        },
        [types_1.VerificationStatus.VERIFYING]: {
            title: '검증 중',
            message: '인증 정보를 확인하고 있습니다.',
            icon: '🔍',
            color: 'text-green-600'
        },
        [types_1.VerificationStatus.SUCCESS]: {
            title: '인증 완료',
            message: '본인인증이 성공적으로 완료되었습니다.',
            icon: '✅',
            color: 'text-green-600'
        },
        [types_1.VerificationStatus.FAILED]: {
            title: '인증 실패',
            message: '본인인증에 실패했습니다. 다시 시도해주세요.',
            icon: '❌',
            color: 'text-red-600'
        },
        [types_1.VerificationStatus.EXPIRED]: {
            title: '인증 만료',
            message: '인증 시간이 만료되었습니다. 다시 시도해주세요.',
            icon: '⏰',
            color: 'text-orange-600'
        },
        [types_1.VerificationStatus.CANCELLED]: {
            title: '인증 취소',
            message: '본인인증이 취소되었습니다.',
            icon: '🚫',
            color: 'text-gray-600'
        }
    };
    const info = statusInfo[status] || statusInfo[types_1.VerificationStatus.IDLE];
    const isLoading = [types_1.VerificationStatus.INITIALIZING, types_1.VerificationStatus.IN_PROGRESS, types_1.VerificationStatus.VERIFYING].includes(status);
    return ((0, jsx_runtime_1.jsxs)("div", { className: `verification-status ${className}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-center py-12", children: [(0, jsx_runtime_1.jsx)("div", { className: `text-6xl mb-4 ${isLoading ? 'animate-pulse' : ''}`, children: info.icon }), (0, jsx_runtime_1.jsxs)("h3", { className: `text-2xl font-bold mb-2 ${info.color}`, children: [info.title, isLoading ? dots : ''] }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-600 mb-8 max-w-md mx-auto", children: info.message }), isLoading && ((0, jsx_runtime_1.jsx)("div", { className: "w-64 mx-auto mb-8", children: (0, jsx_runtime_1.jsx)("div", { className: "h-2 bg-gray-200 rounded-full overflow-hidden", children: (0, jsx_runtime_1.jsx)("div", { className: "h-full bg-blue-500 rounded-full animate-progress" }) }) })), status === types_1.VerificationStatus.IN_PROGRESS && ((0, jsx_runtime_1.jsx)("div", { className: "bg-blue-50 p-4 rounded-lg max-w-md mx-auto mb-6", children: (0, jsx_runtime_1.jsxs)("p", { className: "text-sm text-blue-700", children: [(0, jsx_runtime_1.jsx)("strong", { children: "\uC548\uB0B4:" }), " \uC0C8 \uCC3D\uC5D0\uC11C \uBCF8\uC778\uC778\uC99D\uC744 \uC9C4\uD589\uD574\uC8FC\uC138\uC694.", (0, jsx_runtime_1.jsx)("br", {}), "\uD31D\uC5C5 \uCC28\uB2E8\uC774 \uB418\uC5B4\uC788\uB2E4\uBA74 \uD31D\uC5C5\uC744 \uD5C8\uC6A9\uD574\uC8FC\uC138\uC694."] }) })), onCancel && isLoading && ((0, jsx_runtime_1.jsx)("button", { onClick: onCancel, className: "px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50", children: "\uC778\uC99D \uCDE8\uC18C" }))] }), (0, jsx_runtime_1.jsx)("style", { children: `
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        
        .animate-progress {
          animation: progress 2s ease-in-out infinite;
        }
      ` })] }));
};
exports.VerificationStatus = VerificationStatus;
//# sourceMappingURL=VerificationStatus.js.map