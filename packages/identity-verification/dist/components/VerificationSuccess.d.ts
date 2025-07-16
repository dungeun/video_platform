import React from 'react';
import { UserIdentity } from '../types';
interface VerificationSuccessProps {
    /** 인증된 사용자 정보 */
    identity: UserIdentity;
    /** 닫기 콜백 */
    onClose: () => void;
    /** 커스텀 스타일 */
    className?: string;
}
/**
 * 본인인증 성공 화면 컴포넌트
 */
export declare const VerificationSuccess: React.FC<VerificationSuccessProps>;
export {};
//# sourceMappingURL=VerificationSuccess.d.ts.map