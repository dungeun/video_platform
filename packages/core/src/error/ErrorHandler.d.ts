/**
 * @company/core - 에러 핸들러
 * Zero Error Architecture를 위한 안전한 에러 처리
 */
import { ModuleError } from '../types';
export declare class ErrorHandler {
    private moduleName;
    private lastError?;
    constructor(moduleName: string);
    /**
     * 에러를 안전하게 처리하여 ModuleError로 변환
     */
    handle(error: any, context?: string): ModuleError;
    /**
     * 새로운 ModuleError 생성
     */
    createError(code: string, message: string, details?: any, correlationId?: string): ModuleError;
    /**
     * 마지막 에러 반환
     */
    getLastError(): ModuleError | undefined;
    /**
     * 에러 초기화
     */
    clearLastError(): void;
    /**
     * 에러가 특정 코드인지 확인
     */
    isErrorCode(error: ModuleError, code: string): boolean;
    /**
     * 에러가 복구 가능한지 확인
     */
    isRecoverable(error: ModuleError): boolean;
    /**
     * 에러가 재시도 가능한지 확인
     */
    isRetryable(error: ModuleError): boolean;
    /**
     * 다양한 에러 타입을 ModuleError로 정규화
     */
    private normalizeError;
    /**
     * ModuleError 타입 가드
     */
    private isModuleError;
    /**
     * Error 객체에서 ModuleError 생성
     */
    private fromError;
    /**
     * 문자열에서 ModuleError 생성
     */
    private fromString;
    /**
     * 객체에서 ModuleError 생성
     */
    private fromObject;
    /**
     * 네트워크 에러 판별
     */
    private isNetworkError;
    /**
     * 타임아웃 에러 판별
     */
    private isTimeoutError;
    /**
     * 검증 에러 판별
     */
    private isValidationError;
    /**
     * 에러 로깅
     */
    private logError;
}
/**
 * 에러가 ModuleError인지 확인
 */
export declare function isModuleError(error: any): error is ModuleError;
/**
 * 안전한 에러 메시지 추출
 */
export declare function getErrorMessage(error: any): string;
/**
 * 에러 코드 추출
 */
export declare function getErrorCode(error: any): string;
//# sourceMappingURL=ErrorHandler.d.ts.map