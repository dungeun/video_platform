import React from 'react';
import { VerificationError as ErrorType } from '../types';
interface VerificationErrorProps {
    /** 오류 정보 */
    error: ErrorType;
    /** 재시도 콜백 */
    onRetry?: () => void;
    /** 취소 콜백 */
    onCancel?: () => void;
    /** 커스텀 스타일 */
    className?: string;
}
/**
 * 본인인증 오류 화면 컴포넌트
 */
export declare const VerificationError: React.FC<VerificationErrorProps>;
export {};
//# sourceMappingURL=VerificationError.d.ts.map