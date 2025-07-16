import React from 'react';
import { VerificationStatus as Status } from '../types';
interface VerificationStatusProps {
    /** 현재 상태 */
    status: Status;
    /** 취소 콜백 */
    onCancel?: () => void;
    /** 커스텀 스타일 */
    className?: string;
}
/**
 * 본인인증 진행 상태 표시 컴포넌트
 */
export declare const VerificationStatus: React.FC<VerificationStatusProps>;
export {};
//# sourceMappingURL=VerificationStatus.d.ts.map