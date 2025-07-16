/**
 * @company/api-client - 재시도 관리자
 * HTTP 요청 재시도 로직 관리
 */

import { Logger } from '@company/core';
import { RetryConfig, HttpError } from '../types';

export class RetryManager {
  private logger: Logger;
  private defaultConfig: Required<RetryConfig> = {
    maxAttempts: 3,
    delay: 1000,
    backoffMultiplier: 2,
    maxDelay: 30000,
    shouldRetry: this.defaultShouldRetry.bind(this),
    onRetry: () => {}
  };

  constructor(config?: RetryConfig) {
    this.logger = new Logger('RetryManager');
    if (config) {
      this.defaultConfig = { ...this.defaultConfig, ...config };
    }
  }

  /**
   * 재시도 로직과 함께 함수 실행
   */
  public async executeWithRetry<T>(
    fn: () => Promise<T>,
    config?: RetryConfig
  ): Promise<T> {
    const retryConfig = { ...this.defaultConfig, ...config };
    let lastError: any;
    let delay = retryConfig.delay;

    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt === retryConfig.maxAttempts) {
          this.logger.error('최대 재시도 횟수 초과', {
            attempts: attempt,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          throw error;
        }

        const httpError = error as HttpError;
        if (!retryConfig.shouldRetry(httpError, attempt)) {
          this.logger.debug('재시도 조건 미충족', {
            attempt,
            status: httpError.response?.status
          });
          throw error;
        }

        // 재시도 콜백 호출
        retryConfig.onRetry(httpError, attempt);

        // 대기
        this.logger.info(`재시도 대기중... (${attempt}/${retryConfig.maxAttempts})`, {
          delay,
          nextAttempt: attempt + 1
        });

        await this.sleep(delay);

        // 지수 백오프
        delay = Math.min(delay * retryConfig.backoffMultiplier, retryConfig.maxDelay);
      }
    }

    throw lastError;
  }

  /**
   * 기본 재시도 조건
   */
  private defaultShouldRetry(error: HttpError, attempt: number): boolean {
    // 네트워크 에러
    if (!error.response) {
      return true;
    }

    const status = error.response.status;

    // 5xx 서버 에러
    if (status >= 500 && status < 600) {
      return true;
    }

    // 429 Too Many Requests
    if (status === 429) {
      return true;
    }

    // 408 Request Timeout
    if (status === 408) {
      return true;
    }

    // 특정 에러 코드
    const retryCodes = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED'];
    if (error.code && retryCodes.includes(error.code)) {
      return true;
    }

    return false;
  }

  /**
   * 대기
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 재시도 지연 시간 계산 (지터 포함)
   */
  public calculateDelay(
    baseDelay: number,
    attempt: number,
    maxDelay: number,
    includeJitter: boolean = true
  ): number {
    // 지수 백오프
    let delay = baseDelay * Math.pow(2, attempt - 1);

    // 최대 지연 시간 제한
    delay = Math.min(delay, maxDelay);

    // 지터 추가 (0.8 ~ 1.2 범위)
    if (includeJitter) {
      const jitter = 0.8 + Math.random() * 0.4;
      delay = Math.floor(delay * jitter);
    }

    return delay;
  }

  /**
   * Retry-After 헤더 파싱
   */
  public parseRetryAfter(retryAfter: string | null): number | null {
    if (!retryAfter) {
      return null;
    }

    // 숫자인 경우 (초 단위)
    const seconds = parseInt(retryAfter, 10);
    if (!isNaN(seconds)) {
      return seconds * 1000;
    }

    // 날짜 문자열인 경우
    const retryDate = new Date(retryAfter);
    if (!isNaN(retryDate.getTime())) {
      const delay = retryDate.getTime() - Date.now();
      return delay > 0 ? delay : null;
    }

    return null;
  }

  /**
   * 서킷 브레이커 패턴 구현
   */
  public createCircuitBreaker(
    threshold: number = 5,
    resetTimeout: number = 60000
  ) {
    let failures = 0;
    let lastFailureTime = 0;
    let isOpen = false;

    return {
      recordSuccess: () => {
        failures = 0;
        isOpen = false;
      },

      recordFailure: () => {
        failures++;
        lastFailureTime = Date.now();
        
        if (failures >= threshold) {
          isOpen = true;
          this.logger.warn('서킷 브레이커 오픈', {
            failures,
            threshold
          });
        }
      },

      canExecute: (): boolean => {
        if (!isOpen) {
          return true;
        }

        // 리셋 타임아웃 확인
        if (Date.now() - lastFailureTime > resetTimeout) {
          this.logger.info('서킷 브레이커 리셋');
          failures = 0;
          isOpen = false;
          return true;
        }

        return false;
      },

      getState: () => ({
        isOpen,
        failures,
        lastFailureTime
      })
    };
  }
}