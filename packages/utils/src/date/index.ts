/**
 * @company/utils - 날짜/시간 유틸리티
 */

import { Result as CoreResult } from '@company/core';

// Utils에서 사용할 Result 타입 (에러를 문자열로 처리)
export type Result<T> = CoreResult<T, string>;

// ===== 날짜 포맷팅 =====

/**
 * 날짜를 ISO 8601 형식으로 포맷
 */
export function formatToISO(date: Date): Result<string> {
  try {
    if (!isValidDate(date)) {
      return { success: false, error: '유효하지 않은 날짜입니다' };
    }
    
    return { success: true, data: date.toISOString() };
  } catch (error) {
    return { success: false, error: `ISO 포맷 변환 실패: ${error}` };
  }
}

/**
 * 날짜를 지정된 형식으로 포맷
 */
export function formatDate(date: Date, format: string): Result<string> {
  try {
    if (!isValidDate(date)) {
      return { success: false, error: '유효하지 않은 날짜입니다' };
    }
    
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const milliseconds = date.getMilliseconds().toString().padStart(3, '0');
    
    const replacements: Record<string, string> = {
      'YYYY': year.toString(),
      'YY': year.toString().slice(-2),
      'MM': month,
      'M': (date.getMonth() + 1).toString(),
      'DD': day,
      'D': date.getDate().toString(),
      'HH': hours,
      'H': date.getHours().toString(),
      'mm': minutes,
      'm': date.getMinutes().toString(),
      'ss': seconds,
      's': date.getSeconds().toString(),
      'SSS': milliseconds,
    };
    
    let formatted = format;
    for (const [pattern, replacement] of Object.entries(replacements)) {
      formatted = formatted.replace(new RegExp(pattern, 'g'), replacement);
    }
    
    return { success: true, data: formatted };
  } catch (error) {
    return { success: false, error: `날짜 포맷 변환 실패: ${error}` };
  }
}

/**
 * 상대적 시간 표시 (예: "2시간 전", "3일 후")
 */
export function formatRelativeTime(date: Date, baseDate: Date = new Date()): Result<string> {
  try {
    if (!isValidDate(date) || !isValidDate(baseDate)) {
      return { success: false, error: '유효하지 않은 날짜입니다' };
    }
    
    const diffMs = date.getTime() - baseDate.getTime();
    const absDiffMs = Math.abs(diffMs);
    const isPast = diffMs < 0;
    
    const units = [
      { name: '년', ms: 365 * 24 * 60 * 60 * 1000 },
      { name: '개월', ms: 30 * 24 * 60 * 60 * 1000 },
      { name: '일', ms: 24 * 60 * 60 * 1000 },
      { name: '시간', ms: 60 * 60 * 1000 },
      { name: '분', ms: 60 * 1000 },
      { name: '초', ms: 1000 }
    ];
    
    for (const unit of units) {
      const value = Math.floor(absDiffMs / unit.ms);
      if (value >= 1) {
        const suffix = isPast ? '전' : '후';
        return { success: true, data: `${value}${unit.name} ${suffix}` };
      }
    }
    
    return { success: true, data: '방금' };
  } catch (error) {
    return { success: false, error: `상대적 시간 포맷 실패: ${error}` };
  }
}

// ===== 날짜 파싱 =====

/**
 * 문자열을 Date 객체로 파싱
 */
export function parseDate(dateString: string): Result<Date> {
  try {
    const date = new Date(dateString);
    
    if (!isValidDate(date)) {
      return { success: false, error: '유효하지 않은 날짜 문자열입니다' };
    }
    
    return { success: true, data: date };
  } catch (error) {
    return { success: false, error: `날짜 파싱 실패: ${error}` };
  }
}

/**
 * ISO 8601 형식 문자열을 Date 객체로 파싱
 */
export function parseISODate(isoString: string): Result<Date> {
  try {
    const date = new Date(isoString);
    
    if (!isValidDate(date)) {
      return { success: false, error: '유효하지 않은 ISO 날짜 문자열입니다' };
    }
    
    return { success: true, data: date };
  } catch (error) {
    return { success: false, error: `ISO 날짜 파싱 실패: ${error}` };
  }
}

/**
 * 커스텀 형식 문자열을 Date 객체로 파싱
 */
export function parseCustomDate(dateString: string, format: string): Result<Date> {
  try {
    // 간단한 파싱 구현 (YYYY-MM-DD, YYYY/MM/DD 등)
    const patterns = [
      { regex: /^(\d{4})-(\d{2})-(\d{2})$/, format: 'YYYY-MM-DD' },
      { regex: /^(\d{4})\/(\d{2})\/(\d{2})$/, format: 'YYYY/MM/DD' },
      { regex: /^(\d{2})\/(\d{2})\/(\d{4})$/, format: 'MM/DD/YYYY' },
      { regex: /^(\d{2})-(\d{2})-(\d{4})$/, format: 'MM-DD-YYYY' }
    ];
    
    for (const pattern of patterns) {
      if (pattern.format === format) {
        const match = dateString.match(pattern.regex);
        if (match) {
          let year: number, month: number, day: number;
          
          if (format.startsWith('YYYY')) {
            [, year, month, day] = match.map(Number);
          } else {
            [, month, day, year] = match.map(Number);
          }
          
          const date = new Date(year, month - 1, day);
          
          if (!isValidDate(date)) {
            return { success: false, error: '유효하지 않은 날짜값입니다' };
          }
          
          return { success: true, data: date };
        }
      }
    }
    
    return { success: false, error: '지원하지 않는 날짜 형식입니다' };
  } catch (error) {
    return { success: false, error: `커스텀 날짜 파싱 실패: ${error}` };
  }
}

// ===== 날짜 연산 =====

/**
 * 날짜에 일수 추가
 */
export function addDays(date: Date, days: number): Result<Date> {
  try {
    if (!isValidDate(date)) {
      return { success: false, error: '유효하지 않은 날짜입니다' };
    }
    
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    
    return { success: true, data: newDate };
  } catch (error) {
    return { success: false, error: `날짜 계산 실패: ${error}` };
  }
}

/**
 * 날짜에 월수 추가
 */
export function addMonths(date: Date, months: number): Result<Date> {
  try {
    if (!isValidDate(date)) {
      return { success: false, error: '유효하지 않은 날짜입니다' };
    }
    
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + months);
    
    return { success: true, data: newDate };
  } catch (error) {
    return { success: false, error: `날짜 계산 실패: ${error}` };
  }
}

/**
 * 날짜에 년수 추가
 */
export function addYears(date: Date, years: number): Result<Date> {
  try {
    if (!isValidDate(date)) {
      return { success: false, error: '유효하지 않은 날짜입니다' };
    }
    
    const newDate = new Date(date);
    newDate.setFullYear(newDate.getFullYear() + years);
    
    return { success: true, data: newDate };
  } catch (error) {
    return { success: false, error: `날짜 계산 실패: ${error}` };
  }
}

/**
 * 두 날짜 간의 차이 계산 (일수)
 */
export function getDaysDifference(date1: Date, date2: Date): Result<number> {
  try {
    if (!isValidDate(date1) || !isValidDate(date2)) {
      return { success: false, error: '유효하지 않은 날짜입니다' };
    }
    
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return { success: true, data: diffDays };
  } catch (error) {
    return { success: false, error: `날짜 차이 계산 실패: ${error}` };
  }
}

// ===== 날짜 검증 =====

/**
 * 유효한 Date 객체인지 확인
 */
export function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * 날짜가 특정 범위 내에 있는지 확인
 */
export function isDateInRange(date: Date, startDate: Date, endDate: Date): Result<boolean> {
  try {
    if (!isValidDate(date) || !isValidDate(startDate) || !isValidDate(endDate)) {
      return { success: false, error: '유효하지 않은 날짜입니다' };
    }
    
    const dateTime = date.getTime();
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();
    
    const isInRange = dateTime >= startTime && dateTime <= endTime;
    return { success: true, data: isInRange };
  } catch (error) {
    return { success: false, error: `날짜 범위 검증 실패: ${error}` };
  }
}

/**
 * 윤년인지 확인
 */
export function isLeapYear(year: number): Result<boolean> {
  try {
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    return { success: true, data: isLeap };
  } catch (error) {
    return { success: false, error: `윤년 검증 실패: ${error}` };
  }
}

// ===== 시간대 처리 =====

/**
 * UTC 시간으로 변환
 */
export function toUTC(date: Date): Result<Date> {
  try {
    if (!isValidDate(date)) {
      return { success: false, error: '유효하지 않은 날짜입니다' };
    }
    
    const utcDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
    return { success: true, data: utcDate };
  } catch (error) {
    return { success: false, error: `UTC 변환 실패: ${error}` };
  }
}

/**
 * 로컬 시간으로 변환
 */
export function toLocal(utcDate: Date): Result<Date> {
  try {
    if (!isValidDate(utcDate)) {
      return { success: false, error: '유효하지 않은 날짜입니다' };
    }
    
    const localDate = new Date(utcDate.getTime() - (utcDate.getTimezoneOffset() * 60000));
    return { success: true, data: localDate };
  } catch (error) {
    return { success: false, error: `로컬 시간 변환 실패: ${error}` };
  }
}

// ===== 날짜 생성 헬퍼 =====

/**
 * 오늘 날짜 (시간 00:00:00)
 */
export function today(): Result<Date> {
  try {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return { success: true, data: date };
  } catch (error) {
    return { success: false, error: `오늘 날짜 생성 실패: ${error}` };
  }
}

/**
 * 내일 날짜 (시간 00:00:00)
 */
export function tomorrow(): Result<Date> {
  try {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    date.setHours(0, 0, 0, 0);
    return { success: true, data: date };
  } catch (error) {
    return { success: false, error: `내일 날짜 생성 실패: ${error}` };
  }
}

/**
 * 어제 날짜 (시간 00:00:00)
 */
export function yesterday(): Result<Date> {
  try {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    date.setHours(0, 0, 0, 0);
    return { success: true, data: date };
  } catch (error) {
    return { success: false, error: `어제 날짜 생성 실패: ${error}` };
  }
}

/**
 * 이번 주 시작일 (월요일)
 */
export function startOfWeek(date: Date = new Date()): Result<Date> {
  try {
    if (!isValidDate(date)) {
      return { success: false, error: '유효하지 않은 날짜입니다' };
    }
    
    const startDate = new Date(date);
    const day = startDate.getDay();
    const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // 일요일이면 -6, 아니면 1
    startDate.setDate(diff);
    startDate.setHours(0, 0, 0, 0);
    
    return { success: true, data: startDate };
  } catch (error) {
    return { success: false, error: `주 시작일 계산 실패: ${error}` };
  }
}

/**
 * 이번 달 시작일
 */
export function startOfMonth(date: Date = new Date()): Result<Date> {
  try {
    if (!isValidDate(date)) {
      return { success: false, error: '유효하지 않은 날짜입니다' };
    }
    
    const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
    return { success: true, data: startDate };
  } catch (error) {
    return { success: false, error: `월 시작일 계산 실패: ${error}` };
  }
}

/**
 * 이번 달 마지막일
 */
export function endOfMonth(date: Date = new Date()): Result<Date> {
  try {
    if (!isValidDate(date)) {
      return { success: false, error: '유효하지 않은 날짜입니다' };
    }
    
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    endDate.setHours(23, 59, 59, 999);
    
    return { success: true, data: endDate };
  } catch (error) {
    return { success: false, error: `월 마지막일 계산 실패: ${error}` };
  }
}