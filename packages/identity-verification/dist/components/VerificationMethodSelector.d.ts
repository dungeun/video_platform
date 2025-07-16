import React from 'react';
import { VerificationMethod } from '../types';
interface VerificationMethodSelectorProps {
    /** 사용 가능한 인증 수단 */
    availableMethods: VerificationMethod[];
    /** 선택 콜백 */
    onSelect: (method: VerificationMethod) => void;
    /** 취소 콜백 */
    onCancel?: () => void;
}
/**
 * 본인인증 수단 선택 컴포넌트
 */
export declare const VerificationMethodSelector: React.FC<VerificationMethodSelectorProps>;
export {};
//# sourceMappingURL=VerificationMethodSelector.d.ts.map