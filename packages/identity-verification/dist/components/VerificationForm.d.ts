import React from 'react';
import { VerificationMethod, VerificationRequest } from '../types';
interface VerificationFormProps {
    /** 선택된 인증 수단 */
    method: VerificationMethod;
    /** 폼 데이터 */
    data: Partial<VerificationRequest>;
    /** 데이터 변경 콜백 */
    onChange: (data: Partial<VerificationRequest>) => void;
    /** 제출 콜백 */
    onSubmit: () => void;
    /** 뒤로가기 콜백 */
    onBack?: () => void;
    /** 취소 콜백 */
    onCancel?: () => void;
}
/**
 * 본인인증 정보 입력 폼
 */
export declare const VerificationForm: React.FC<VerificationFormProps>;
export {};
//# sourceMappingURL=VerificationForm.d.ts.map