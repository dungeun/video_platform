import { VerificationRequest } from '../types';
/**
 * 폼 데이터 검증
 */
export declare function validateForm(data: VerificationRequest): Record<string, string>;
/**
 * 생년월일 유효성 검사
 */
export declare function isValidBirthDate(birthDate: string): boolean;
/**
 * 휴대폰 번호 유효성 검사
 */
export declare function isValidPhoneNumber(phoneNumber: string): boolean;
/**
 * 주민등록번호 유효성 검사 (앞자리만)
 */
export declare function isValidRRNPrefix(rrnPrefix: string): boolean;
/**
 * 이름 유효성 검사
 */
export declare function isValidName(name: string): boolean;
/**
 * 성인 여부 확인
 */
export declare function isAdult(birthDate: string): boolean;
/**
 * 외국인 등록번호 유효성 검사
 */
export declare function isValidForeignerNumber(number: string): boolean;
//# sourceMappingURL=validators.d.ts.map