"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityVerification = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const VerificationMethodSelector_1 = require("./VerificationMethodSelector");
const VerificationForm_1 = require("./VerificationForm");
const VerificationStatus_1 = require("./VerificationStatus");
const VerificationSuccess_1 = require("./VerificationSuccess");
const VerificationError_1 = require("./VerificationError");
const useVerification_1 = require("../hooks/useVerification");
const types_1 = require("../types");
/**
 * 본인인증 통합 컴포넌트
 */
const IdentityVerification = ({ availableMethods = [
    types_1.VerificationMethod.PASS,
    types_1.VerificationMethod.MOBILE_CARRIER,
    types_1.VerificationMethod.KAKAO,
    types_1.VerificationMethod.NAVER
], onSuccess, onError, onCancel, className = '' }) => {
    const [selectedMethod, setSelectedMethod] = (0, react_1.useState)(null);
    const [formData, setFormData] = (0, react_1.useState)({
        name: '',
        birthDate: '',
        gender: undefined,
        phoneNumber: '',
        carrier: undefined,
        nationality: 'korean'
    });
    const { status, error, identity, startVerification, checkStatus, cancelVerification, reset } = (0, useVerification_1.useVerification)();
    /**
     * 인증 수단 선택 처리
     */
    const handleMethodSelect = (0, react_1.useCallback)((method) => {
        setSelectedMethod(method);
    }, []);
    /**
     * 폼 데이터 변경 처리
     */
    const handleFormChange = (0, react_1.useCallback)((data) => {
        setFormData(prev => ({ ...prev, ...data }));
    }, []);
    /**
     * 인증 시작 처리
     */
    const handleStartVerification = (0, react_1.useCallback)(async () => {
        if (!selectedMethod)
            return;
        const request = {
            method: selectedMethod,
            name: formData.name || '',
            birthDate: formData.birthDate || '',
            gender: formData.gender,
            phoneNumber: formData.phoneNumber || '',
            carrier: formData.carrier,
            nationality: formData.nationality || 'korean'
        };
        await startVerification(request);
    }, [selectedMethod, formData, startVerification]);
    /**
     * 재시도 처리
     */
    const handleRetry = (0, react_1.useCallback)(() => {
        reset();
        setSelectedMethod(null);
        setFormData({
            name: '',
            birthDate: '',
            gender: undefined,
            phoneNumber: '',
            carrier: undefined,
            nationality: 'korean'
        });
    }, [reset]);
    /**
     * 취소 처리
     */
    const handleCancel = (0, react_1.useCallback)(() => {
        if (status === types_1.VerificationStatus.IN_PROGRESS || status === types_1.VerificationStatus.VERIFYING) {
            cancelVerification();
        }
        onCancel?.();
    }, [status, cancelVerification, onCancel]);
    // 상태에 따른 화면 렌더링
    if (status === types_1.VerificationStatus.SUCCESS && identity) {
        return ((0, jsx_runtime_1.jsx)(VerificationSuccess_1.VerificationSuccess, { identity: identity, onClose: () => {
                onSuccess?.(identity);
                handleRetry();
            }, className: className }));
    }
    if (status === types_1.VerificationStatus.FAILED && error) {
        return ((0, jsx_runtime_1.jsx)(VerificationError_1.VerificationError, { error: error, onRetry: handleRetry, onCancel: handleCancel, className: className }));
    }
    if (status === types_1.VerificationStatus.IN_PROGRESS || status === types_1.VerificationStatus.VERIFYING) {
        return ((0, jsx_runtime_1.jsx)(VerificationStatus_1.VerificationStatus, { status: status, onCancel: handleCancel, className: className }));
    }
    return ((0, jsx_runtime_1.jsx)("div", { className: `identity-verification ${className}`, children: (0, jsx_runtime_1.jsxs)("div", { className: "p-6 bg-white rounded-lg shadow-lg", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-2xl font-bold mb-6 text-gray-800", children: "\uBCF8\uC778\uC778\uC99D" }), !selectedMethod ? ((0, jsx_runtime_1.jsx)(VerificationMethodSelector_1.VerificationMethodSelector, { availableMethods: availableMethods, onSelect: handleMethodSelect, onCancel: onCancel })) : ((0, jsx_runtime_1.jsx)(VerificationForm_1.VerificationForm, { method: selectedMethod, data: formData, onChange: handleFormChange, onSubmit: handleStartVerification, onBack: () => setSelectedMethod(null), onCancel: onCancel }))] }) }));
};
exports.IdentityVerification = IdentityVerification;
//# sourceMappingURL=IdentityVerification.js.map