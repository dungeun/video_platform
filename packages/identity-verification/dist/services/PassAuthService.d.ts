import { PassAuthConfig, VerificationRequest, VerificationResponse, VerificationResult } from '../types';
/**
 * PASS 인증 서비스
 * 한국 통신 3사 PASS 앱을 통한 본인인증 처리
 */
export declare class PassAuthService {
    private client;
    private config;
    constructor(config: PassAuthConfig);
    /**
     * 인터셉터 설정
     */
    private setupInterceptors;
    /**
     * PASS 인증 요청
     */
    requestVerification(request: VerificationRequest): Promise<VerificationResponse>;
    /**
     * 인증 상태 확인
     */
    checkStatus(verificationId: string): Promise<VerificationResponse>;
    /**
     * 인증 결과 조회
     */
    getResult(verificationId: string, token: string): Promise<VerificationResult>;
    /**
     * 인증 취소
     */
    cancelVerification(verificationId: string): Promise<boolean>;
    /**
     * 요청 데이터 검증
     */
    private validateRequest;
    /**
     * 생년월일 유효성 검사
     */
    private isValidBirthDate;
    /**
     * 휴대폰 번호 유효성 검사
     */
    private isValidPhoneNumber;
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
//# sourceMappingURL=PassAuthService.d.ts.map