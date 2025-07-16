import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * 주소 입력 폼 필드 컴포넌트
 */
import { useState, useCallback } from 'react';
import { AddressSearch } from './AddressSearch';
import { AddressFormattingService } from '../services/AddressFormattingService';
const formattingService = new AddressFormattingService();
export const AddressInput = ({ value, onChange, onSearch, placeholder = '주소를 검색해주세요', disabled = false, readOnly = false, required = false, error, className = '', showPostcode = true, showDetails = true, showExtra = true, addressType = 'ROAD' }) => {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [localValue, setLocalValue] = useState(value);
    const handleSearchClick = useCallback(() => {
        if (!disabled && !readOnly) {
            setIsSearchOpen(true);
            onSearch?.();
        }
    }, [disabled, readOnly, onSearch]);
    const handleSearchComplete = useCallback((result) => {
        const detailedAddress = formattingService.toDetailedAddress(result);
        setLocalValue(detailedAddress);
        onChange?.(detailedAddress);
        setIsSearchOpen(false);
    }, [onChange]);
    const handleDetailChange = useCallback((field, value) => {
        if (!localValue || disabled || readOnly)
            return;
        const updated = {
            ...localValue,
            [field]: value
        };
        setLocalValue(updated);
        onChange?.(updated);
    }, [localValue, disabled, readOnly, onChange]);
    const baseInputClass = `
    w-full px-3 py-2 border rounded-md
    ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
    ${error ? 'border-red-500' : 'border-gray-300'}
    ${readOnly ? 'cursor-default' : ''}
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
  `;
    return (_jsxs("div", { className: `space-y-2 ${className}`, children: [showPostcode && (_jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "text", value: localValue?.zonecode || '', placeholder: "\uC6B0\uD3B8\uBC88\uD638", readOnly: true, required: required, className: `${baseInputClass} flex-shrink-0 w-32`, "aria-label": "\uC6B0\uD3B8\uBC88\uD638" }), _jsx("button", { type: "button", onClick: handleSearchClick, disabled: disabled || readOnly, className: `
              px-4 py-2 rounded-md font-medium transition-colors
              ${disabled || readOnly
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-500 text-white hover:bg-blue-600'}
            `, children: "\uC8FC\uC18C \uAC80\uC0C9" })] })), _jsx("input", { type: "text", value: localValue?.address || '', placeholder: placeholder, readOnly: true, required: required, onClick: handleSearchClick, className: `${baseInputClass} ${!readOnly && !disabled ? 'cursor-pointer' : ''}`, "aria-label": "\uC8FC\uC18C" }), showDetails && (_jsx("input", { type: "text", value: localValue?.detailAddress || '', onChange: (e) => handleDetailChange('detailAddress', e.target.value), placeholder: "\uC0C1\uC138 \uC8FC\uC18C\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694", disabled: disabled || !localValue?.address, readOnly: readOnly, className: baseInputClass, "aria-label": "\uC0C1\uC138 \uC8FC\uC18C" })), showExtra && localValue?.extraAddress && (_jsx("input", { type: "text", value: localValue.extraAddress, readOnly: true, className: `${baseInputClass} bg-gray-50`, "aria-label": "\uCC38\uACE0 \uD56D\uBAA9" })), error && (_jsx("p", { className: "text-sm text-red-500 mt-1", children: error })), _jsx(AddressSearch, { isOpen: isSearchOpen, onClose: () => setIsSearchOpen(false), onComplete: handleSearchComplete, options: {
                    theme: {
                        bgColor: '#FFFFFF',
                        searchBgColor: '#FFFFFF',
                        contentBgColor: '#FFFFFF',
                        pageBgColor: '#FAFAFA',
                        textColor: '#333333',
                        queryTextColor: '#222222',
                        postcodeTextColor: '#FA4256',
                        emphTextColor: '#008BD3',
                        outlineColor: '#E0E0E0'
                    }
                } })] }));
};
export const SimpleAddressInput = ({ value, onChange, placeholder = '주소를 검색해주세요', disabled = false, required = false, error, className = '' }) => {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const handleSearchComplete = useCallback((result) => {
        const detailedAddress = formattingService.toDetailedAddress(result);
        const formattedAddress = formattingService.toSingleLine(detailedAddress, true);
        onChange?.(formattedAddress, detailedAddress);
        setIsSearchOpen(false);
    }, [onChange]);
    return (_jsxs("div", { className: className, children: [_jsxs("div", { className: "relative", children: [_jsx("input", { type: "text", value: value || '', placeholder: placeholder, readOnly: true, required: required, onClick: () => !disabled && setIsSearchOpen(true), className: `
            w-full px-3 py-2 pr-10 border rounded-md
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer'}
            ${error ? 'border-red-500' : 'border-gray-300'}
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          ` }), _jsx("button", { type: "button", onClick: () => !disabled && setIsSearchOpen(true), disabled: disabled, className: "absolute right-2 top-1/2 -translate-y-1/2 p-1", "aria-label": "\uC8FC\uC18C \uAC80\uC0C9", children: _jsx("svg", { className: "w-5 h-5 text-gray-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }) }) })] }), error && (_jsx("p", { className: "text-sm text-red-500 mt-1", children: error })), _jsx(AddressSearch, { isOpen: isSearchOpen, onClose: () => setIsSearchOpen(false), onComplete: handleSearchComplete })] }));
};
//# sourceMappingURL=AddressInput.js.map