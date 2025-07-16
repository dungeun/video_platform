import React from 'react';
import { ValidationResult } from '../types';
interface CouponInputProps {
    value?: string;
    onChange?: (value: string) => void;
    onApply?: (code: string) => void;
    onValidate?: (code: string) => Promise<ValidationResult>;
    placeholder?: string;
    disabled?: boolean;
    error?: string;
    className?: string;
}
export declare const CouponInput: React.FC<CouponInputProps>;
export {};
//# sourceMappingURL=CouponInput.d.ts.map