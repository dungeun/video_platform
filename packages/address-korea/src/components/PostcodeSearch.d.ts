/**
 * 우편번호 검색 전용 컴포넌트
 */
import React from 'react';
import type { AddressSearchResult } from '../types';
interface PostcodeSearchProps {
    value?: string;
    onChange?: (postcode: string, address?: AddressSearchResult) => void;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    error?: string;
    className?: string;
    buttonText?: string;
    buttonPosition?: 'right' | 'bottom';
}
export declare const PostcodeSearch: React.FC<PostcodeSearchProps>;
/**
 * 인라인 우편번호 검색 컴포넌트
 */
interface InlinePostcodeSearchProps {
    value?: string;
    onChange?: (postcode: string) => void;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}
export declare const InlinePostcodeSearch: React.FC<InlinePostcodeSearchProps>;
export {};
//# sourceMappingURL=PostcodeSearch.d.ts.map