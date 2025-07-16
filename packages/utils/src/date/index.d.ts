/**
 * @repo/utils - 날짜/시간 유틸리티
 */
import { Result as CoreResult } from '@repo/core';
export type Result<T> = CoreResult<T, string>;
/**
 * 날짜를 ISO 8601 형식으로 포맷
 */
export declare function formatToISO(date: Date): Result<string>;
/**
 * 날짜를 지정된 형식으로 포맷
 */
export declare function formatDate(date: Date, format: string): Result<string>;
/**
 * 상대적 시간 표시 (예: "2시간 전", "3일 후")
 */
export declare function formatRelativeTime(date: Date, baseDate?: Date): Result<string>;
/**
 * 문자열을 Date 객체로 파싱
 */
export declare function parseDate(dateString: string): Result<Date>;
/**
 * ISO 8601 형식 문자열을 Date 객체로 파싱
 */
export declare function parseISODate(isoString: string): Result<Date>;
/**
 * 커스텀 형식 문자열을 Date 객체로 파싱
 */
export declare function parseCustomDate(dateString: string, format: string): Result<Date>;
/**
 * 날짜에 일수 추가
 */
export declare function addDays(date: Date, days: number): Result<Date>;
/**
 * 날짜에 월수 추가
 */
export declare function addMonths(date: Date, months: number): Result<Date>;
/**
 * 날짜에 년수 추가
 */
export declare function addYears(date: Date, years: number): Result<Date>;
/**
 * 두 날짜 간의 차이 계산 (일수)
 */
export declare function getDaysDifference(date1: Date, date2: Date): Result<number>;
/**
 * 유효한 Date 객체인지 확인
 */
export declare function isValidDate(date: Date): boolean;
/**
 * 날짜가 특정 범위 내에 있는지 확인
 */
export declare function isDateInRange(date: Date, startDate: Date, endDate: Date): Result<boolean>;
/**
 * 윤년인지 확인
 */
export declare function isLeapYear(year: number): Result<boolean>;
/**
 * UTC 시간으로 변환
 */
export declare function toUTC(date: Date): Result<Date>;
/**
 * 로컬 시간으로 변환
 */
export declare function toLocal(utcDate: Date): Result<Date>;
/**
 * 오늘 날짜 (시간 00:00:00)
 */
export declare function today(): Result<Date>;
/**
 * 내일 날짜 (시간 00:00:00)
 */
export declare function tomorrow(): Result<Date>;
/**
 * 어제 날짜 (시간 00:00:00)
 */
export declare function yesterday(): Result<Date>;
/**
 * 이번 주 시작일 (월요일)
 */
export declare function startOfWeek(date?: Date): Result<Date>;
/**
 * 이번 달 시작일
 */
export declare function startOfMonth(date?: Date): Result<Date>;
/**
 * 이번 달 마지막일
 */
export declare function endOfMonth(date?: Date): Result<Date>;
//# sourceMappingURL=index.d.ts.map