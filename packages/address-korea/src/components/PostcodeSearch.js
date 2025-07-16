import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * 우편번호 검색 전용 컴포넌트
 */
import { useState, useCallback } from 'react';
import { AddressSearch } from './AddressSearch';
export const PostcodeSearch = ({ value, onChange, placeholder = '우편번호', disabled = false, required = false, error, className = '', buttonText = '우편번호 찾기', buttonPosition = 'right' }) => {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const handleSearchComplete = useCallback((result) => {
        onChange?.(result.zonecode, result);
        setIsSearchOpen(false);
    }, [onChange]);
    const inputClass = `
    px-3 py-2 border rounded-md
    ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
    ${error ? 'border-red-500' : 'border-gray-300'}
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
  `;
    const buttonClass = `
    px-4 py-2 rounded-md font-medium transition-colors
    ${disabled
        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
        : 'bg-blue-500 text-white hover:bg-blue-600'}
  `;
    return (_jsxs("div", { className: className, children: [buttonPosition === 'right' ? (_jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "text", value: value || '', placeholder: placeholder, readOnly: true, required: required, disabled: disabled, className: `${inputClass} w-32`, "aria-label": "\uC6B0\uD3B8\uBC88\uD638" }), _jsx("button", { type: "button", onClick: () => setIsSearchOpen(true), disabled: disabled, className: buttonClass, children: buttonText })] })) : (_jsxs("div", { className: "space-y-2", children: [_jsx("input", { type: "text", value: value || '', placeholder: placeholder, readOnly: true, required: required, disabled: disabled, className: `${inputClass} w-full`, "aria-label": "\uC6B0\uD3B8\uBC88\uD638" }), _jsx("button", { type: "button", onClick: () => setIsSearchOpen(true), disabled: disabled, className: `${buttonClass} w-full`, children: buttonText })] })), error && (_jsx("p", { className: "text-sm text-red-500 mt-1", children: error })), _jsx(AddressSearch, { isOpen: isSearchOpen, onClose: () => setIsSearchOpen(false), onComplete: handleSearchComplete })] }));
};
export const InlinePostcodeSearch = ({ value, onChange, className = '', size = 'md' }) => {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const handleSearchComplete = useCallback((result) => {
        onChange?.(result.zonecode);
        setIsSearchOpen(false);
    }, [onChange]);
    const sizeClasses = {
        sm: 'text-sm px-2 py-1',
        md: 'text-base px-3 py-2',
        lg: 'text-lg px-4 py-3'
    };
    return (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", onClick: () => setIsSearchOpen(true), onMouseEnter: () => setIsHovered(true), onMouseLeave: () => setIsHovered(false), className: `
          inline-flex items-center gap-2 border rounded-md transition-all
          ${sizeClasses[size]}
          ${value
                    ? 'border-gray-300 hover:border-blue-500'
                    : 'border-dashed border-gray-400 hover:border-blue-500'}
          ${className}
        `, children: value ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "font-mono", children: value }), isHovered && (_jsx("svg", { className: "w-4 h-4 text-gray-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" }) }))] })) : (_jsxs(_Fragment, { children: [_jsx("svg", { className: "w-4 h-4 text-gray-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 4v16m8-8H4" }) }), _jsx("span", { className: "text-gray-500", children: "\uC6B0\uD3B8\uBC88\uD638 \uCD94\uAC00" })] })) }), _jsx(AddressSearch, { isOpen: isSearchOpen, onClose: () => setIsSearchOpen(false), onComplete: handleSearchComplete })] }));
};
//# sourceMappingURL=PostcodeSearch.js.map