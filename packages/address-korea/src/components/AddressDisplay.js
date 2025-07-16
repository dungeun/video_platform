import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AddressFormattingService } from '../services/AddressFormattingService';
const formattingService = new AddressFormattingService();
export const AddressDisplay = ({ address, format = 'single', options, className = '', showCopyButton = false, showMapButton = false, onMapClick }) => {
    const handleCopy = async () => {
        const text = formattingService.format(address, options);
        try {
            await navigator.clipboard.writeText(text);
            // TODO: 복사 완료 토스트 메시지
        }
        catch (err) {
            console.error('Failed to copy address:', err);
        }
    };
    const handleMapClick = () => {
        onMapClick?.(address);
    };
    const renderAddress = () => {
        switch (format) {
            case 'multi':
                return (_jsx("div", { className: "space-y-1", children: formattingService.toMultiLine(address).map((line, index) => (_jsx("div", { className: "text-gray-800", children: line }, index))) }));
            case 'shipping':
                return (_jsx("pre", { className: "font-sans whitespace-pre-wrap text-gray-800", children: formattingService.toShippingLabel(address) }));
            case 'english':
                return (_jsx("div", { className: "text-gray-800", children: formattingService.toEnglish(address) }));
            default:
                return (_jsx("div", { className: "text-gray-800", children: formattingService.format(address, options) }));
        }
    };
    return (_jsxs("div", { className: `relative ${className}`, children: [renderAddress(), (showCopyButton || showMapButton) && (_jsxs("div", { className: "flex gap-2 mt-2", children: [showCopyButton && (_jsxs("button", { onClick: handleCopy, className: "text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1", "aria-label": "\uC8FC\uC18C \uBCF5\uC0AC", children: [_jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" }) }), "\uBCF5\uC0AC"] })), showMapButton && (_jsxs("button", { onClick: handleMapClick, className: "text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1", "aria-label": "\uC9C0\uB3C4\uC5D0\uC11C \uBCF4\uAE30", children: [_jsxs("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: [_jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" }), _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 11a3 3 0 11-6 0 3 3 0 016 0z" })] }), "\uC9C0\uB3C4"] }))] }))] }));
};
export const AddressCard = ({ address, title, isDefault = false, onEdit, onDelete, onSetDefault, className = '' }) => {
    return (_jsxs("div", { className: `border rounded-lg p-4 ${className}`, children: [_jsxs("div", { className: "flex items-start justify-between mb-2", children: [_jsxs("div", { children: [title && (_jsx("h3", { className: "font-medium text-gray-900 mb-1", children: title })), isDefault && (_jsx("span", { className: "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800", children: "\uAE30\uBCF8 \uBC30\uC1A1\uC9C0" }))] }), _jsxs("div", { className: "flex gap-2", children: [onEdit && (_jsx("button", { onClick: onEdit, className: "text-sm text-gray-600 hover:text-gray-800", "aria-label": "\uC218\uC815", children: "\uC218\uC815" })), onDelete && (_jsx("button", { onClick: onDelete, className: "text-sm text-red-600 hover:text-red-700", "aria-label": "\uC0AD\uC81C", children: "\uC0AD\uC81C" }))] })] }), _jsx(AddressDisplay, { address: address, format: "multi", className: "text-sm" }), onSetDefault && !isDefault && (_jsx("button", { onClick: onSetDefault, className: "mt-3 text-sm text-blue-600 hover:text-blue-700", children: "\uAE30\uBCF8 \uBC30\uC1A1\uC9C0\uB85C \uC124\uC815" }))] }));
};
export const AddressSummary = ({ address, maxLength = 30, className = '', onClick }) => {
    const summary = formattingService.summarize(address, maxLength);
    return (_jsxs("div", { className: `flex items-center justify-between ${className} ${onClick ? 'cursor-pointer' : ''}`, onClick: onClick, children: [_jsx("span", { className: "text-gray-800 truncate", children: summary }), onClick && (_jsx("svg", { className: "w-4 h-4 text-gray-400 flex-shrink-0 ml-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5l7 7-7 7" }) }))] }));
};
//# sourceMappingURL=AddressDisplay.js.map