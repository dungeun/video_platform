/**
 * @repo/core - 로거
 * 모듈별 구조화된 로깅 시스템
 */
import { LogLevel } from '../types';
export declare class Logger {
    private moduleName;
    protected logLevel: LogLevel;
    private correlationId?;
    constructor(moduleName: string, logLevel?: LogLevel);
    /**
     * 상관관계 ID 설정 (요청 추적용)
     */
    setCorrelationId(correlationId: string): void;
    /**
     * 상관관계 ID 초기화
     */
    clearCorrelationId(): void;
    /**
     * DEBUG 레벨 로그
     */
    debug(message: string, metadata?: Record<string, any>): void;
    /**
     * INFO 레벨 로그
     */
    info(message: string, metadata?: Record<string, any>): void;
    /**
     * WARN 레벨 로그
     */
    warn(message: string, metadata?: Record<string, any>): void;
    /**
     * ERROR 레벨 로그
     */
    error(message: string, error?: any, metadata?: Record<string, any>): void;
    /**
     * 사용자 액션 로그 (보안/추적용)
     */
    logUserAction(userId: string, action: string, resource?: string, metadata?: Record<string, any>): void;
    /**
     * 성능 로그
     */
    logPerformance(operation: string, duration: number, metadata?: Record<string, any>): void;
    /**
     * 비즈니스 이벤트 로그
     */
    logBusinessEvent(event: string, data?: any, metadata?: Record<string, any>): void;
    /**
     * 자식 로거 생성 (하위 컴포넌트용)
     */
    child(subModule: string): Logger;
    /**
     * 기본 로깅 메서드
     */
    private log;
    /**
     * 로그 레벨 확인
     */
    private shouldLog;
    /**
     * 실제 로그 출력
     */
    private writeLog;
    /**
     * 콘솔 로그 출력 (개발용)
     */
    private consoleLog;
    /**
     * 외부 로깅 서비스로 전송 (프로덕션용)
     */
    private sendToLoggingService;
    /**
     * 모의 로깅 서비스 호출
     */
    private mockLoggingServiceCall;
    /**
     * 에러 객체에서 메타데이터 추출
     */
    private extractErrorMetadata;
}
declare class GlobalLogger extends Logger {
    private static instance;
    private constructor();
    static getInstance(): GlobalLogger;
    /**
     * 전역 로그 레벨 설정
     */
    setGlobalLogLevel(level: LogLevel): void;
}
export declare const globalLogger: GlobalLogger;
export {};
//# sourceMappingURL=Logger.d.ts.map