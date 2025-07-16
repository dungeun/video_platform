/**
 * 주소 입력 폼 필드 컴포넌트
 */
import React from 'react';
import type { AddressInputProps, DetailedAddress } from '../types';
export declare const AddressInput: React.FC<AddressInputProps>;
/**
 * 간단한 주소 입력 필드 (단일 필드)
 */
interface SimpleAddressInputProps {
    value?: string;
    onChange?: (address: string, fullAddress?: DetailedAddress) => void;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    error?: string;
    className?: string;
}
export declare const SimpleAddressInput: React.FC<SimpleAddressInputProps>;
export {};
//# sourceMappingURL=AddressInput.d.ts.map