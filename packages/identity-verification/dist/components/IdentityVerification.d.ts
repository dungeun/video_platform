import React from 'react';
import { VerificationMethod } from '../types';
interface IdentityVerificationProps {
    /** 사용 가능한 인증 수단 */
    availableMethods?: VerificationMethod[];
    /** 인증 완료 콜백 */
    onSuccess?: (identity: any) => void;
    /** 인증 실패 콜백 */
    onError?: (error: any) => void;
    /** 인증 취소 콜백 */
    onCancel?: () => void;
    /** 커스텀 스타일 */
    className?: string;
}
/**
 * 본인인증 통합 컴포넌트
 */
export declare const IdentityVerification: React.FC<IdentityVerificationProps>;
export {};
//# sourceMappingURL=IdentityVerification.d.ts.map