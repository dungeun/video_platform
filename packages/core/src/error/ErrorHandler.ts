/**
 * @company/core - 에러 핸들러
 * Zero Error Architecture를 위한 안전한 에러 처리
 */

import { ModuleError, CommonErrorCodes } from '../types';

export class ErrorHandler {
  private moduleName: string;
  private lastError?: ModuleError;

  constructor(moduleName: string) {
    this.moduleName = moduleName;
  }

  /**
   * 에러를 안전하게 처리하여 ModuleError로 변환
   */
  public handle(error: any, context?: string): ModuleError {
    const moduleError = this.normalizeError(error, context);
    this.lastError = moduleError;
    
    // 에러 로깅 (실제 환경에서는 외부 로깅 서비스 사용)
    this.logError(moduleError);
    
    return moduleError;
  }

  /**
   * 새로운 ModuleError 생성
   */
  public createError(
    code: string,
    message: string,
    details?: any,
    correlationId?: string
  ): ModuleError {
    const error: ModuleError = {
      name: code,
      code,
      message,
      details,
      timestamp: Date.now(),
      source: this.moduleName,
      correlationId
    };

    this.lastError = error;
    return error;
  }

  /**
   * 마지막 에러 반환
   */
  public getLastError(): ModuleError | undefined {
    return this.lastError;
  }

  /**
   * 에러 초기화
   */
  public clearLastError(): void {
    this.lastError = undefined;
  }

  /**
   * 에러가 특정 코드인지 확인
   */
  public isErrorCode(error: ModuleError, code: string): boolean {
    return error.code === code;
  }

  /**
   * 에러가 복구 가능한지 확인
   */
  public isRecoverable(error: ModuleError): boolean {
    const recoverableErrors = [
      CommonErrorCodes.NETWORK_ERROR,
      CommonErrorCodes.API_UNAVAILABLE,
      CommonErrorCodes.RATE_LIMIT_EXCEEDED
    ];
    
    return recoverableErrors.includes(error.code as CommonErrorCodes);
  }

  /**
   * 에러가 재시도 가능한지 확인
   */
  public isRetryable(error: ModuleError): boolean {
    const retryableErrors = [
      CommonErrorCodes.NETWORK_ERROR,
      CommonErrorCodes.SYSTEM_TIMEOUT,
      CommonErrorCodes.RATE_LIMIT_EXCEEDED
    ];
    
    return retryableErrors.includes(error.code as CommonErrorCodes);
  }

  // ===== 내부 메서드 =====

  /**
   * 다양한 에러 타입을 ModuleError로 정규화
   */
  private normalizeError(error: any, context?: string): ModuleError {
    // 이미 ModuleError인 경우
    if (this.isModuleError(error)) {
      return error;
    }

    // Error 객체인 경우
    if (error instanceof Error) {
      return this.fromError(error, context);
    }

    // 문자열인 경우
    if (typeof error === 'string') {
      return this.fromString(error, context);
    }

    // 객체인 경우
    if (typeof error === 'object' && error !== null) {
      return this.fromObject(error, context);
    }

    // 기타 타입인 경우
    return this.createError(
      CommonErrorCodes.SYSTEM_INTERNAL_ERROR,
      context || '알 수 없는 오류가 발생했습니다',
      { originalError: error }
    );
  }

  /**
   * ModuleError 타입 가드
   */
  private isModuleError(error: any): error is ModuleError {
    return (
      typeof error === 'object' &&
      error !== null &&
      typeof error.code === 'string' &&
      typeof error.message === 'string' &&
      typeof error.timestamp === 'number'
    );
  }

  /**
   * Error 객체에서 ModuleError 생성
   */
  private fromError(error: Error, context?: string): ModuleError {
    // 네트워크 에러 판별
    if (this.isNetworkError(error)) {
      return this.createError(
        CommonErrorCodes.NETWORK_ERROR,
        '네트워크 연결에 실패했습니다',
        { originalMessage: error.message }
      );
    }

    // 타임아웃 에러 판별
    if (this.isTimeoutError(error)) {
      return this.createError(
        CommonErrorCodes.SYSTEM_TIMEOUT,
        '요청 시간이 초과되었습니다',
        { originalMessage: error.message }
      );
    }

    // 검증 에러 판별
    if (this.isValidationError(error)) {
      return this.createError(
        CommonErrorCodes.VALIDATION_FAILED,
        error.message || '입력값이 올바르지 않습니다',
        { originalMessage: error.message }
      );
    }

    // 일반 에러
    return this.createError(
      CommonErrorCodes.SYSTEM_INTERNAL_ERROR,
      context || error.message || '시스템 오류가 발생했습니다',
      { 
        originalMessage: error.message,
        stack: error.stack 
      }
    );
  }

  /**
   * 문자열에서 ModuleError 생성
   */
  private fromString(error: string, context?: string): ModuleError {
    return this.createError(
      CommonErrorCodes.SYSTEM_INTERNAL_ERROR,
      context || error || '오류가 발생했습니다'
    );
  }

  /**
   * 객체에서 ModuleError 생성
   */
  private fromObject(error: any, context?: string): ModuleError {
    const code = error.code || CommonErrorCodes.SYSTEM_INTERNAL_ERROR;
    const message = error.message || context || '오류가 발생했습니다';
    
    return this.createError(code, message, error);
  }

  /**
   * 네트워크 에러 판별
   */
  private isNetworkError(error: Error): boolean {
    const networkKeywords = [
      'network', 'fetch', 'axios', 'connection',
      'ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT'
    ];
    
    const message = error.message.toLowerCase();
    return networkKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * 타임아웃 에러 판별
   */
  private isTimeoutError(error: Error): boolean {
    const timeoutKeywords = ['timeout', 'ETIMEDOUT'];
    const message = error.message.toLowerCase();
    return timeoutKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * 검증 에러 판별
   */
  private isValidationError(error: Error): boolean {
    // Zod 에러 체크
    if (error.name === 'ZodError') {
      return true;
    }
    
    const validationKeywords = ['validation', 'invalid', 'required'];
    const message = error.message.toLowerCase();
    return validationKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * 에러 로깅
   */
  private logError(error: ModuleError): void {
    const logData = {
      module: this.moduleName,
      error: {
        code: error.code,
        message: error.message,
        timestamp: new Date(error.timestamp).toISOString(),
        source: error.source,
        correlationId: error.correlationId
      }
    };

    // 개발 환경에서는 콘솔 출력
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Module Error:', logData);
      
      if (error.details) {
        console.error('Error Details:', error.details);
      }
    }

    // 실제 환경에서는 외부 로깅 서비스로 전송
    // 예: Sentry, CloudWatch, ELK Stack 등
  }
}

// ===== 에러 유틸리티 함수 =====

/**
 * 에러가 ModuleError인지 확인
 */
export function isModuleError(error: any): error is ModuleError {
  return (
    typeof error === 'object' &&
    error !== null &&
    typeof error.code === 'string' &&
    typeof error.message === 'string' &&
    typeof error.timestamp === 'number'
  );
}

/**
 * 안전한 에러 메시지 추출
 */
export function getErrorMessage(error: any): string {
  if (isModuleError(error)) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return '알 수 없는 오류가 발생했습니다';
}

/**
 * 에러 코드 추출
 */
export function getErrorCode(error: any): string {
  if (isModuleError(error)) {
    return error.code;
  }
  
  return CommonErrorCodes.SYSTEM_INTERNAL_ERROR;
}