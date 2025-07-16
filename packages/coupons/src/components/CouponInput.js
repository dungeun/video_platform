import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
export const CouponInput = ({ value: controlledValue, onChange, onApply, onValidate, placeholder = 'Enter coupon code', disabled = false, error: externalError, className = '' }) => {
    const [internalValue, setInternalValue] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [validationError, setValidationError] = useState(null);
    const value = controlledValue !== undefined ? controlledValue : internalValue;
    const error = externalError || validationError;
    const handleChange = useCallback((e) => {
        const newValue = e.target.value.toUpperCase();
        if (controlledValue === undefined) {
            setInternalValue(newValue);
        }
        onChange?.(newValue);
        setValidationError(null);
    }, [controlledValue, onChange]);
    const handleApply = useCallback(async () => {
        const trimmedValue = value.trim();
        if (!trimmedValue) {
            setValidationError('Please enter a coupon code');
            return;
        }
        if (onValidate) {
            try {
                setIsValidating(true);
                const result = await onValidate(trimmedValue);
                if (!result.isValid) {
                    setValidationError(result.errors?.[0]?.message || 'Invalid coupon code');
                    return;
                }
            }
            catch (err) {
                setValidationError('Failed to validate coupon');
                return;
            }
            finally {
                setIsValidating(false);
            }
        }
        onApply?.(trimmedValue);
    }, [value, onValidate, onApply]);
    const handleKeyPress = useCallback((e) => {
        if (e.key === 'Enter' && !disabled && !isValidating) {
            handleApply();
        }
    }, [disabled, isValidating, handleApply]);
    return (_jsxs("div", { className: `coupon-input-container ${className}`, children: [_jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "text", value: value, onChange: handleChange, onKeyPress: handleKeyPress, placeholder: placeholder, disabled: disabled || isValidating, className: `
            flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2
            ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          ` }), _jsx("button", { onClick: handleApply, disabled: disabled || isValidating || !value.trim(), className: `
            px-6 py-2 rounded-lg font-medium transition-colors
            ${disabled || isValidating || !value.trim()
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'}
          `, children: isValidating ? 'Validating...' : 'Apply' })] }), error && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: error }))] }));
};
//# sourceMappingURL=CouponInput.js.map