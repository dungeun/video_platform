/**
 * @company/core - 로거
 * 모듈별 구조화된 로깅 시스템
 */

import { LogLevel, LogEntry } from '../types';

export class Logger {
  private moduleName: string;
  protected logLevel: LogLevel;
  private correlationId?: string;

  constructor(moduleName: string, logLevel: LogLevel = LogLevel.INFO) {
    this.moduleName = moduleName;
    this.logLevel = logLevel;
  }

  /**
   * 상관관계 ID 설정 (요청 추적용)
   */
  public setCorrelationId(correlationId: string): void {
    this.correlationId = correlationId;
  }

  /**
   * 상관관계 ID 초기화
   */
  public clearCorrelationId(): void {
    this.correlationId = undefined;
  }

  /**
   * DEBUG 레벨 로그
   */
  public debug(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  /**
   * INFO 레벨 로그
   */
  public info(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  /**
   * WARN 레벨 로그
   */
  public warn(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  /**
   * ERROR 레벨 로그
   */
  public error(message: string, error?: any, metadata?: Record<string, any>): void {
    const errorMetadata = this.extractErrorMetadata(error);
    const combinedMetadata = { ...metadata, ...errorMetadata };
    
    this.log(LogLevel.ERROR, message, combinedMetadata);
  }

  /**
   * 사용자 액션 로그 (보안/추적용)
   */
  public logUserAction(
    userId: string,
    action: string,
    resource?: string,
    metadata?: Record<string, any>
  ): void {
    this.info(`사용자 액션: ${action}`, {
      userId,
      action,
      resource,
      type: 'user_action',
      ...metadata
    });
  }

  /**
   * 성능 로그
   */
  public logPerformance(
    operation: string,
    duration: number,
    metadata?: Record<string, any>
  ): void {
    this.info(`성능: ${operation}`, {
      operation,
      duration,
      type: 'performance',
      ...metadata
    });
  }

  /**
   * 비즈니스 이벤트 로그
   */
  public logBusinessEvent(
    event: string,
    data?: any,
    metadata?: Record<string, any>
  ): void {
    this.info(`비즈니스 이벤트: ${event}`, {
      event,
      data,
      type: 'business_event',
      ...metadata
    });
  }

  /**
   * 자식 로거 생성 (하위 컴포넌트용)
   */
  public child(subModule: string): Logger {
    const childLogger = new Logger(
      `${this.moduleName}.${subModule}`,
      this.logLevel
    );
    
    if (this.correlationId) {
      childLogger.setCorrelationId(this.correlationId);
    }
    
    return childLogger;
  }

  // ===== 내부 메서드 =====

  /**
   * 기본 로깅 메서드
   */
  private log(level: LogLevel, message: string, metadata?: Record<string, any>): void {
    // 로그 레벨 체크
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      module: this.moduleName,
      correlationId: this.correlationId,
      metadata
    };

    // 실제 로깅 수행
    this.writeLog(entry);
  }

  /**
   * 로그 레벨 확인
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    
    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * 실제 로그 출력
   */
  private writeLog(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    const module = `[${entry.module}]`.padEnd(20);
    
    let logMessage = `${timestamp} ${level} ${module} ${entry.message}`;
    
    // 상관관계 ID가 있으면 추가
    if (entry.correlationId) {
      logMessage += ` [${entry.correlationId}]`;
    }

    // 개발 환경에서는 콘솔 출력
    if (process.env.NODE_ENV === 'development') {
      this.consoleLog(entry, logMessage);
    }

    // 프로덕션 환경에서는 외부 로깅 서비스로 전송
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(entry);
    }
  }

  /**
   * 콘솔 로그 출력 (개발용)
   */
  private consoleLog(entry: LogEntry, message: string): void {
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message);
        break;
      case LogLevel.INFO:
        console.info(message);
        break;
      case LogLevel.WARN:
        console.warn(message);
        break;
      case LogLevel.ERROR:
        console.error(message);
        break;
    }

    // 메타데이터가 있으면 별도 출력
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      console.log('Metadata:', entry.metadata);
    }
  }

  /**
   * 외부 로깅 서비스로 전송 (프로덕션용)
   */
  private sendToLoggingService(entry: LogEntry): void {
    // 실제 환경에서는 다음과 같은 서비스들과 연동:
    // - Winston + CloudWatch
    // - Sentry (에러 로그)
    // - ELK Stack
    // - Datadog
    
    // 여기서는 구현 예시만 제공
    try {
      // 비동기로 로그 전송 (블로킹 방지)
      setImmediate(() => {
        // 실제 로깅 서비스 API 호출
        this.mockLoggingServiceCall(entry);
      });
    } catch (error) {
      // 로깅 실패해도 애플리케이션은 계속 동작
      console.error('로깅 서비스 전송 실패:', error);
    }
  }

  /**
   * 모의 로깅 서비스 호출
   */
  private mockLoggingServiceCall(entry: LogEntry): void {
    // 실제로는 HTTP 요청이나 AWS SDK 호출
    // fetch('/api/logs', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(entry)
    // });
  }

  /**
   * 에러 객체에서 메타데이터 추출
   */
  private extractErrorMetadata(error: any): Record<string, any> {
    if (!error) {
      return {};
    }

    const metadata: Record<string, any> = {};

    // Error 객체인 경우
    if (error instanceof Error) {
      metadata.errorName = error.name;
      metadata.errorMessage = error.message;
      
      if (error.stack) {
        metadata.stackTrace = error.stack;
      }
    }

    // ModuleError인 경우
    if (error.code && error.timestamp) {
      metadata.errorCode = error.code;
      metadata.errorTimestamp = error.timestamp;
      metadata.errorSource = error.source;
      
      if (error.details) {
        metadata.errorDetails = error.details;
      }
    }

    // 기타 객체인 경우
    if (typeof error === 'object' && error !== null) {
      metadata.errorData = error;
    }

    return metadata;
  }
}

// ===== 전역 로거 인스턴스 =====

class GlobalLogger extends Logger {
  private static instance: GlobalLogger;

  private constructor() {
    super('GLOBAL', LogLevel.INFO);
  }

  public static getInstance(): GlobalLogger {
    if (!GlobalLogger.instance) {
      GlobalLogger.instance = new GlobalLogger();
    }
    return GlobalLogger.instance;
  }

  /**
   * 전역 로그 레벨 설정
   */
  public setGlobalLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }
}

export const globalLogger = GlobalLogger.getInstance();