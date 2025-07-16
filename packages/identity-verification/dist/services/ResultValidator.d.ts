import { UserIdentity, VerificationResult } from '../types';
/**
 * 본인인증 결과 검증 서비스
 * 인증 결과의 유효성을 검증하고 데이터 무결성을 확인
 */
export declare class ResultValidator {
    /**
     * 인증 결과 전체 검증
     */
    validateResult(result: VerificationResult): boolean;
    /**
     * 사용자 신원 정보 검증
     */
    validateIdentity(identity: UserIdentity): boolean;
    /**
     * CI (Connecting Information) 검증
     * 88자리 Base64 인코딩된 문자열
     */
    private validateCI;
    /**
     * DI (Duplication Information) 검증
     * 64자리 Base64 인코딩된 문자열
     */
    private validateDI;
    /**
     * 이름 검증
     */
    private validateName;
    /**
     * 생년월일 검증
     */
    private validateBirthDate;
    /**
     * 휴대폰 번호 검증
     */
    private validatePhoneNumber;
    /**
     * 성인 여부 계산
     */
    private calculateAdult;
    /**
     * 오류 정보 검증
     */
    private validateError;
    /**
     * 데이터 무결성 검증
     * 실제 환경에서는 서명 검증 등 추가 보안 검증 필요
     */
    validateIntegrity(data: any, signature?: string): boolean;
    /**
     * 타임스탬프 검증
     * 인증 결과가 너무 오래되지 않았는지 확인
     */
    validateTimestamp(timestamp: Date, maxAgeMinutes?: number): boolean;
    /**
     * 주민등록번호 유효성 검증 (마스킹된 형태)
     * 실제 주민등록번호는 저장하지 않고 검증만 수행
     */
    validateMaskedRRN(maskedRRN: string): boolean;
}
//# sourceMappingURL=ResultValidator.d.ts.map