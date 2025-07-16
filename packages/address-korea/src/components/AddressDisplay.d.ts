/**
 * 주소 표시 컴포넌트
 */
import React from 'react';
import type { DetailedAddress, AddressFormatOptions } from '../types';
interface AddressDisplayProps {
    address: DetailedAddress;
    format?: 'single' | 'multi' | 'shipping' | 'english';
    options?: AddressFormatOptions;
    className?: string;
    showCopyButton?: boolean;
    showMapButton?: boolean;
    onMapClick?: (address: DetailedAddress) => void;
}
export declare const AddressDisplay: React.FC<AddressDisplayProps>;
/**
 * 주소 카드 컴포넌트
 */
interface AddressCardProps {
    address: DetailedAddress;
    title?: string;
    isDefault?: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
    onSetDefault?: () => void;
    className?: string;
}
export declare const AddressCard: React.FC<AddressCardProps>;
/**
 * 주소 요약 표시 컴포넌트 (모바일용)
 */
interface AddressSummaryProps {
    address: DetailedAddress;
    maxLength?: number;
    className?: string;
    onClick?: () => void;
}
export declare const AddressSummary: React.FC<AddressSummaryProps>;
export {};
//# sourceMappingURL=AddressDisplay.d.ts.map