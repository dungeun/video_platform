/**
 * 휴대폰 번호 포맷팅
 */
export declare function formatPhoneNumber(value: string): string;
/**
 * 생년월일 포맷팅
 */
export declare function formatBirthDate(value: string): string;
/**
 * 휴대폰 번호 마스킹
 */
export declare function maskPhoneNumber(phoneNumber: string): string;
/**
 * 이름 마스킹
 */
export declare function maskName(name: string): string;
/**
 * 주민등록번호 마스킹
 */
export declare function maskRRN(rrn: string): string;
/**
 * CI 마스킹
 */
export declare function maskCI(ci: string): string;
/**
 * 날짜 포맷팅
 */
export declare function formatDate(date: Date | string): string;
/**
 * 날짜/시간 포맷팅
 */
export declare function formatDateTime(date: Date | string): string;
/**
 * 생년월일을 나이로 변환
 */
export declare function birthDateToAge(birthDate: string): number;
/**
 * 성별 텍스트 변환
 */
export declare function formatGender(gender: 'M' | 'F' | string): string;
/**
 * 통신사 이름 변환
 */
export declare function formatCarrier(carrier: string): string;
/**
 * 인증 수단 이름 변환
 */
export declare function formatVerificationMethod(method: string): string;
//# sourceMappingURL=formatters.d.ts.map