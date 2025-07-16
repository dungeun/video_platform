import { MobileCarrier, VerificationRequest, VerificationResponse, VerificationResult } from '../types';
/**
 * 통신사 본인인증 서비스
 * SKT, KT, LGU+ 통신사를 통한 본인인증 처리
 */
export declare class MobileCarrierService {
    private clients;
    private apiKeys;
    constructor(config: {
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
    });
    /**
     * 통신사 본인인증 요청
     */
    requestVerification(request: VerificationRequest): Promise<VerificationResponse>;
    /**
     * 통신사별 인증 요청 전송
     */
    private sendVerificationRequest;
    /**
     * 인증 상태 확인
     */
    checkStatus(verificationId: string, carrier: MobileCarrier): Promise<VerificationResponse>;
    /**
     * 인증 결과 조회
     */
    getResult(verificationId: string, token: string, carrier: MobileCarrier): Promise<VerificationResult>;
    /**
     * 통신사 자동 감지
     */
    private detectCarrier;
    /**
     * 휴대폰 번호 포맷팅
     */
    private formatPhoneNumber;
    /**
     * 성인 여부 확인
     */
    private checkAdult;
    /**
     * 상태 매핑
     */
    private mapStatus;
    /**
     * 오류 처리
     */
    private handleError;
}
//# sourceMappingURL=MobileCarrierService.d.ts.map