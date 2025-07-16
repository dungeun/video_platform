/**
 * @company/utils - 포맷팅 유틸리티
 */
import { Result as CoreResult } from '@company/core';
export type Result<T> = CoreResult<T, string>;
/**
 * 숫자에 천 단위 구분자 추가
 */
export declare function formatNumber(num: number, locale?: string, options?: Intl.NumberFormatOptions): Result<string>;
/**
 * 통화 포맷팅
 */
export declare function formatCurrency(amount: number, currency?: string, locale?: string): Result<string>;
/**
 * 백분율 포맷팅
 */
export declare function formatPercentage(value: number, decimals?: number, locale?: string): Result<string>;
/**
 * 파일 크기 포맷팅
 */
export declare function formatFileSize(bytes: number, decimals?: number): Result<string>;
/**
 * 한국 전화번호 포맷팅
 */
export declare function formatKoreanPhoneNumber(phoneNumber: string): Result<string>;
/**
 * 주민등록번호 포맷팅 (마스킹 옵션)
 */
export declare function formatKoreanSSN(ssn: string, mask?: boolean): Result<string>;
/**
 * 신용카드 번호 포맷팅 (마스킹 옵션)
 */
export declare function formatCreditCardNumber(cardNumber: string, mask?: boolean): Result<string>;
/**
 * 이메일 마스킹
 */
export declare function maskEmail(email: string): Result<string>;
/**
 * 이름 마스킹
 */
export declare function maskName(name: string): Result<string>;
/**
 * JSON 예쁘게 포맷팅
 */
export declare function formatJSON(obj: any, indent?: number): Result<string>;
/**
 * JSON 압축 (공백 제거)
 */
export declare function compactJSON(obj: any): Result<string>;
/**
 * URL 쿼리 파라미터 포맷팅
 */
export declare function formatQueryParams(params: Record<string, any>): Result<string>;
/**
 * URL 정규화
 */
export declare function normalizeUrl(url: string): Result<string>;
/**
 * 한국 주소 포맷팅
 */
export declare function formatKoreanAddress(address: {
    zipCode?: string;
    state?: string;
    city: string;
    district?: string;
    street: string;
    detail?: string;
}): Result<string>;
/**
 * 상대적 시간 포맷팅 (예: "2시간 전")
 */
export declare function formatRelativeTime(date: Date, baseDate?: Date): Result<string>;
//# sourceMappingURL=index.d.ts.map