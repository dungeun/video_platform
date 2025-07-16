import { VerificationRequest, VerificationStatus, VerificationError, UserIdentity, VerificationEvent, PassAuthConfig } from '../types';
interface UseVerificationOptions {
    /** PASS 인증 설정 */
    passConfig?: PassAuthConfig;
    /** 통신사 인증 설정 */
    carrierConfig?: {
        skt?: {
            endpoint: string;
            apiKey: string;
        };
        kt?: {
            endpoint: string;
            apiKey: string;
        };
        lgu?: {
            endpoint: string;
            apiKey: string;
        };
    };
    /** 상태 체크 주기 (ms) */
    checkInterval?: number;
    /** 최대 체크 횟수 */
    maxCheckAttempts?: number;
    /** 이벤트 핸들러 */
    onEvent?: (event: VerificationEvent) => void;
}
interface UseVerificationReturn {
    /** 현재 상태 */
    status: VerificationStatus;
    /** 오류 정보 */
    error: VerificationError | null;
    /** 인증된 사용자 정보 */
    identity: UserIdentity | null;
    /** 인증 ID */
    verificationId: string | null;
    /** 인증 시작 */
    startVerification: (request: VerificationRequest) => Promise<void>;
    /** 상태 확인 */
    checkStatus: () => Promise<void>;
    /** 인증 취소 */
    cancelVerification: () => Promise<void>;
    /** 상태 초기화 */
    reset: () => void;
}
/**
 * 본인인증 훅
 */
export declare function useVerification(options?: UseVerificationOptions): UseVerificationReturn;
export {};
//# sourceMappingURL=useVerification.d.ts.map