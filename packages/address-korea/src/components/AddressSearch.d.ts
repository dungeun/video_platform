/**
 * 주소 검색 팝업/모달 컴포넌트
 */
import React from 'react';
import type { AddressSearchModalProps, AddressSearchResult } from '../types';
export declare const AddressSearch: React.FC<AddressSearchModalProps>;
/**
 * 임베드 방식 주소 검색 컴포넌트
 */
interface AddressSearchEmbedProps {
    onComplete: (address: AddressSearchResult) => void;
    options?: AddressSearchModalProps['options'];
    className?: string;
    height?: string | number;
}
export declare const AddressSearchEmbed: React.FC<AddressSearchEmbedProps>;
export {};
//# sourceMappingURL=AddressSearch.d.ts.map