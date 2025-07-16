/**
 * @company/utils - Enterprise AI Module System Utilities
 *
 * 모든 엔터프라이즈 AI 모듈에서 사용하는 공통 유틸리티 함수들
 *
 * @version 1.0.0
 * @author Enterprise AI Team
 */
// ===== 암호화/해시 유틸리티 =====
export * as crypto from './crypto';
// ===== 날짜/시간 유틸리티 =====
export * as date from './date';
// ===== 문자열 처리 유틸리티 =====
export * as string from './string';
// ===== 배열 처리 유틸리티 =====
export * as array from './array';
// ===== 객체 처리 유틸리티 =====
export * as object from './object';
// ===== 검증 유틸리티 =====
export * as validation from './validation';
// ===== 비동기 처리 유틸리티 =====
export * as async from './async';
// ===== 포맷팅 유틸리티 =====
export * as format from './format';
// ===== HTTP 요청 유틸리티 =====
export * as http from './http';
// ===== 파일 처리 유틸리티 (Node.js 환경에서만) =====
export * as file from './file';
// ===== 모듈 정보 =====
export const UTILS_MODULE_INFO = {
    name: '@company/utils',
    version: '1.0.0',
    description: 'Enterprise AI Module System - Utility Functions',
    author: 'Enterprise AI Team',
    license: 'MIT',
    categories: [
        'crypto', // 암호화/해시
        'date', // 날짜/시간
        'string', // 문자열 처리
        'array', // 배열 처리
        'object', // 객체 처리
        'validation', // 검증
        'async', // 비동기 처리
        'format', // 포맷팅
        'http', // HTTP 요청
        'file' // 파일 처리
    ]
};
// ===== 헬퍼 클래스 재수출 =====
export { 
// HTTP 클라이언트
HttpClient, AdvancedHttpClient, UrlBuilder, HttpStatus } from './http';
export { 
// 비동기 유틸리티
SequentialQueue, TTLCache } from './async';
// ===== 간편 함수 내보내기 (order-processing에서 필요) =====
export function formatDate(date, locale = 'ko-KR') {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
export function formatCurrency(amount, currency = 'USD', locale = 'en-US') {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency
    }).format(amount);
}
export function generateId(prefix = '') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 9);
    return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}
// ===== 상수 =====
export const UTILS_CONSTANTS = {
    // 기본 인코딩
    DEFAULT_ENCODING: 'utf8',
    // 기본 타임아웃 (밀리초)
    DEFAULT_TIMEOUT: 10000,
    // 기본 재시도 횟수
    DEFAULT_RETRIES: 3,
    // 기본 청크 크기
    DEFAULT_CHUNK_SIZE: 100,
    // 기본 동시 실행 수
    DEFAULT_CONCURRENCY: 5,
    // 기본 캐시 TTL (밀리초)
    DEFAULT_CACHE_TTL: 60000,
    // 파일 크기 단위
    FILE_SIZE_UNITS: ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'],
    // HTTP 상태 코드
    HTTP_STATUS: {
        OK: 200,
        CREATED: 201,
        NO_CONTENT: 204,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        INTERNAL_SERVER_ERROR: 500
    },
    // MIME 타입
    MIME_TYPES: {
        JSON: 'application/json',
        XML: 'application/xml',
        HTML: 'text/html',
        PLAIN: 'text/plain',
        PDF: 'application/pdf',
        JPEG: 'image/jpeg',
        PNG: 'image/png',
        GIF: 'image/gif'
    }
};
//# sourceMappingURL=index.js.map