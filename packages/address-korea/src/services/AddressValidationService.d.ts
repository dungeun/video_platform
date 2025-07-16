/**
 * 주소 유효성 검사 서비스
 */
import type { DetailedAddress, AddressValidationResult } from '../types';
export declare class AddressValidationService {
    /**
     * 주소 유효성 검사
     */
    validate(address: DetailedAddress): AddressValidationResult;
    /**
     * 우편번호 형식 검사
     */
    private isValidPostcode;
    /**
     * 특수문자 검사
     */
    private containsInvalidCharacters;
    /**
     * 주소 정규화
     */
    private normalizeAddress;
    /**
     * 텍스트 정규화
     */
    private normalizeText;
    /**
     * 시/도 정규화
     */
    private normalizeSido;
    /**
     * 시/군/구 정규화
     */
    private normalizeSigungu;
    /**
     * 배송 가능 지역 확인
     */
    isDeliverable(address: DetailedAddress): boolean;
    /**
     * 주소 완성도 점수 계산
     */
    calculateCompleteness(address: DetailedAddress): number;
}
//# sourceMappingURL=AddressValidationService.d.ts.map