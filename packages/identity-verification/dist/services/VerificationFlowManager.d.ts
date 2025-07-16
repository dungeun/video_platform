import { VerificationRequest, VerificationResponse, VerificationResult, VerificationSession, VerificationEvent } from '../types';
import { PassAuthService } from './PassAuthService';
import { MobileCarrierService } from './MobileCarrierService';
/**
 * 본인인증 흐름 관리 서비스
 * 다양한 인증 수단을 통합 관리하고 인증 프로세스를 조율
 */
export declare class VerificationFlowManager {
    private passAuthService?;
    private mobileCarrierService?;
    private sessions;
    private eventHandlers;
    constructor(config: {
        pass?: PassAuthService;
        mobileCarrier?: MobileCarrierService;
    });
    /**
     * 본인인증 시작
     */
    startVerification(request: VerificationRequest): Promise<VerificationResponse>;
    /**
     * 인증 상태 확인
     */
    checkStatus(verificationId: string): Promise<VerificationResponse>;
    /**
     * 인증 결과 확인
     */
    verifyResult(verificationId: string, token: string): Promise<VerificationResult>;
    /**
     * 인증 취소
     */
    cancelVerification(verificationId: string): Promise<boolean>;
    /**
     * 이벤트 리스너 등록
     */
    onEvent(handler: (event: VerificationEvent) => void): () => void;
    /**
     * 세션 조회
     */
    getSession(verificationId: string): VerificationSession | undefined;
    /**
     * 활성 세션 목록 조회
     */
    getActiveSessions(): VerificationSession[];
    /**
     * 세션 생성
     */
    private createSession;
    /**
     * 세션 ID 생성
     */
    private generateSessionId;
    /**
     * 요청 검증
     */
    private validateRequest;
    /**
     * 이벤트 발생
     */
    private emitEvent;
    /**
     * 만료된 세션 정리
     */
    private startSessionCleanup;
}
//# sourceMappingURL=VerificationFlowManager.d.ts.map