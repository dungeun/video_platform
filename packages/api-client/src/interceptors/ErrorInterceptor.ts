/**
 * @company/api-client - 에러 인터셉터
 * HTTP 에러 처리 및 변환
 */

import { ResponseInterceptor, HttpError, ApiError } from '../types';
import { Logger } from '@company/core';

export interface ErrorInterceptorConfig {
  // 에러 변환
  transformError?: (error: HttpError) => ApiError | null;
  
  // 에러 핸들러
  onNetworkError?: (error: HttpError) => void;
  onServerError?: (error: HttpError) => void;
  onClientError?: (error: HttpError) => void;
  onTimeoutError?: (error: HttpError) => void;
  
  // 재시도 가능 여부
  isRetryable?: (error: HttpError) => boolean;
  
  // 에러 메시지 맵
  errorMessages?: Record<number, string>;
  
  // 상세 에러 로깅
  logDetails?: boolean;
}

export class ErrorInterceptor {
  private logger: Logger;
  private config: ErrorInterceptorConfig;
  private defaultErrorMessages: Record<number, string> = {
    400: '잘못된 요청입니다',
    401: '인증이 필요합니다',
    403: '접근 권한이 없습니다',
    404: '요청한 리소스를 찾을 수 없습니다',
    408: '요청 시간이 초과되었습니다',
    429: '너무 많은 요청을 보냈습니다',
    500: '서버 내부 오류가 발생했습니다',
    502: '게이트웨이 오류가 발생했습니다',
    503: '서비스를 일시적으로 사용할 수 없습니다',
    504: '게이트웨이 시간이 초과되었습니다'
  };

  constructor(config?: ErrorInterceptorConfig) {
    this.logger = new Logger('ErrorInterceptor');
    this.config = {
      logDetails: true,
      errorMessages: { ...this.defaultErrorMessages },
      ...config
    };
  }

  /**
   * 응답 에러 인터셉터 생성
   */
  public createResponseInterceptor(): ResponseInterceptor {
    return {
      onFulfilled: (response) => response,
      
      onRejected: (error: HttpError) => {
        // 에러 분류 및 처리
        if (!error.response) {
          return this.handleNetworkError(error);
        }

        const status = error.response.status;

        if (status >= 500) {
          return this.handleServerError(error);
        }

        if (status >= 400 && status < 500) {
          return this.handleClientError(error);
        }

        return Promise.reject(this.transformError(error));
      }
    };
  }

  /**
   * 네트워크 에러 처리
   */
  private handleNetworkError(error: HttpError): Promise<never> {
    const enhancedError = this.enhanceError(error, {
      code: 'NETWORK_ERROR',
      message: this.getNetworkErrorMessage(error)
    });

    if (this.config.logDetails) {
      this.logger.error('네트워크 에러', {
        code: error.code,
        message: error.message,
        url: error.config?.url
      });
    }

    if (this.config.onNetworkError) {
      this.config.onNetworkError(enhancedError);
    }

    return Promise.reject(enhancedError);
  }

  /**
   * 서버 에러 처리 (5xx)
   */
  private handleServerError(error: HttpError): Promise<never> {
    const status = error.response!.status;
    const enhancedError = this.enhanceError(error, {
      code: `SERVER_ERROR_${status}`,
      message: this.config.errorMessages![status] || '서버 오류가 발생했습니다'
    });

    if (this.config.logDetails) {
      this.logger.error('서버 에러', {
        status,
        statusText: error.response!.statusText,
        url: error.config?.url,
        data: error.response!.data
      });
    }

    if (this.config.onServerError) {
      this.config.onServerError(enhancedError);
    }

    return Promise.reject(enhancedError);
  }

  /**
   * 클라이언트 에러 처리 (4xx)
   */
  private handleClientError(error: HttpError): Promise<never> {
    const status = error.response!.status;
    const enhancedError = this.enhanceError(error, {
      code: `CLIENT_ERROR_${status}`,
      message: this.extractErrorMessage(error) || 
               this.config.errorMessages![status] || 
               '요청 처리 중 오류가 발생했습니다'
    });

    if (this.config.logDetails) {
      this.logger.warn('클라이언트 에러', {
        status,
        statusText: error.response!.statusText,
        url: error.config?.url,
        data: error.response!.data
      });
    }

    if (this.config.onClientError) {
      this.config.onClientError(enhancedError);
    }

    // 타임아웃 에러 특별 처리
    if (status === 408 && this.config.onTimeoutError) {
      this.config.onTimeoutError(enhancedError);
    }

    return Promise.reject(enhancedError);
  }

  /**
   * 에러 변환
   */
  private transformError(error: HttpError): HttpError {
    // 사용자 정의 변환
    if (this.config.transformError) {
      const apiError = this.config.transformError(error);
      if (apiError) {
        (error as any).apiError = apiError;
      }
    }

    // 재시도 가능 여부 추가
    if (this.config.isRetryable) {
      (error as any).isRetryable = this.config.isRetryable(error);
    }

    return error;
  }

  /**
   * 에러 개선
   */
  private enhanceError(
    error: HttpError, 
    enhancement: { code: string; message: string }
  ): HttpError {
    error.code = enhancement.code;
    error.message = enhancement.message;

    // 추가 메타데이터
    (error as any).timestamp = new Date().toISOString();
    (error as any).url = error.config?.url;
    (error as any).method = error.config?.method;

    return this.transformError(error);
  }

  /**
   * 에러 메시지 추출
   */
  private extractErrorMessage(error: HttpError): string | null {
    const data = error.response?.data;
    
    if (!data) {
      return null;
    }

    // 일반적인 에러 메시지 필드 확인
    const messageFields = ['message', 'error', 'detail', 'details', 'reason'];
    
    for (const field of messageFields) {
      if (data[field]) {
        return String(data[field]);
      }
    }

    // 중첩된 에러 객체 확인
    if (data.error && typeof data.error === 'object') {
      for (const field of messageFields) {
        if (data.error[field]) {
          return String(data.error[field]);
        }
      }
    }

    return null;
  }

  /**
   * 네트워크 에러 메시지 생성
   */
  private getNetworkErrorMessage(error: HttpError): string {
    if (error.code === 'ECONNABORTED') {
      return '요청 시간이 초과되었습니다';
    }
    
    if (error.code === 'ENOTFOUND') {
      return '서버를 찾을 수 없습니다';
    }
    
    if (error.code === 'ECONNREFUSED') {
      return '서버에 연결할 수 없습니다';
    }
    
    if (error.message.includes('Network Error')) {
      return '네트워크 연결을 확인해주세요';
    }
    
    return '네트워크 오류가 발생했습니다';
  }

  /**
   * 에러 통계 수집
   */
  private errorStats = new Map<string, number>();

  public collectErrorStats(error: HttpError): void {
    const key = error.code || 'UNKNOWN';
    const count = this.errorStats.get(key) || 0;
    this.errorStats.set(key, count + 1);
  }

  public getErrorStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    this.errorStats.forEach((count, code) => {
      stats[code] = count;
    });
    return stats;
  }

  public clearErrorStats(): void {
    this.errorStats.clear();
  }
}