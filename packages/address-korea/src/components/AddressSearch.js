import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * 주소 검색 팝업/모달 컴포넌트
 */
import { useState, useEffect, useRef } from 'react';
import { DaumPostcodeService } from '../services/DaumPostcodeService';
export const AddressSearch = ({ isOpen, onClose, onComplete, options, className = '' }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const modalRef = useRef(null);
    const postcodeService = DaumPostcodeService.getInstance();
    useEffect(() => {
        if (isOpen) {
            handleSearch();
        }
    }, [isOpen]);
    const handleSearch = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await postcodeService.openSearch(options);
            onComplete(result);
            onClose();
        }
        catch (err) {
            if (err instanceof Error && err.message !== 'User closed the popup') {
                setError('주소 검색 중 오류가 발생했습니다.');
                console.error('Address search error:', err);
            }
            onClose();
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };
    if (!isOpen)
        return null;
    return (_jsx("div", { className: `fixed inset-0 z-50 flex items-center justify-center bg-black/50 ${className}`, onClick: handleBackdropClick, children: _jsxs("div", { ref: modalRef, className: "relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4", children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b", children: [_jsx("h2", { className: "text-lg font-semibold", children: "\uC8FC\uC18C \uAC80\uC0C9" }), _jsx("button", { onClick: onClose, className: "p-1 hover:bg-gray-100 rounded-full transition-colors", "aria-label": "\uB2EB\uAE30", children: _jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) })] }), _jsxs("div", { className: "p-4", children: [isLoading && (_jsxs("div", { className: "flex items-center justify-center py-8", children: [_jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" }), _jsx("span", { className: "ml-3 text-gray-600", children: "\uC8FC\uC18C \uAC80\uC0C9\uCC3D\uC744 \uBD88\uB7EC\uC624\uB294 \uC911..." })] })), error && (_jsx("div", { className: "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded", children: error })), _jsxs("div", { className: "text-center text-gray-500 py-8", children: [_jsx("p", { children: "Daum \uC6B0\uD3B8\uBC88\uD638 \uAC80\uC0C9 \uD31D\uC5C5\uC774 \uC5F4\uB9BD\uB2C8\uB2E4." }), _jsx("p", { className: "text-sm mt-2", children: "\uD31D\uC5C5\uC774 \uCC28\uB2E8\uB41C \uACBD\uC6B0 \uD31D\uC5C5 \uCC28\uB2E8\uC744 \uD574\uC81C\uD574\uC8FC\uC138\uC694." })] })] })] }) }));
};
export const AddressSearchEmbed = ({ onComplete, options, className = '', height = 400 }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const embedId = useRef(`postcode-embed-${Date.now()}`);
    const postcodeService = DaumPostcodeService.getInstance();
    useEffect(() => {
        loadEmbed();
    }, []);
    const loadEmbed = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await postcodeService.embedSearch(embedId.current, options);
            onComplete(result);
        }
        catch (err) {
            setError('주소 검색을 불러오는데 실패했습니다.');
            console.error('Address search embed error:', err);
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsxs("div", { className: `relative ${className}`, children: [isLoading && (_jsx("div", { className: "absolute inset-0 bg-white/80 flex items-center justify-center z-10", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" }) })), error && (_jsxs("div", { className: "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4", children: [error, _jsx("button", { onClick: loadEmbed, className: "ml-4 text-sm underline hover:no-underline", children: "\uB2E4\uC2DC \uC2DC\uB3C4" })] })), _jsx("div", { id: embedId.current, className: "border rounded-lg overflow-hidden", style: { height: typeof height === 'number' ? `${height}px` : height } })] }));
};
//# sourceMappingURL=AddressSearch.js.map