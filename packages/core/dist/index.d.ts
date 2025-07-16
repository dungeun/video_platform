/**
 * @company/core - 핵심 타입 정의
 * Zero Error Architecture 기반 타입 시스템
 */
interface ModuleConfig {
    name: string;
    version: string;
    description?: string;
    dependencies?: string[];
    metadata?: Record<string, any>;
}
interface ModuleInfo {
    config: ModuleConfig;
    status: ModuleStatus;
    loadedAt: Date;
    error?: ModuleError;
}
declare enum ModuleStatus {
    LOADING = "loading",
    LOADED = "loaded",
    ERROR = "error",
    DISABLED = "disabled"
}
interface Result<T, E = Error> {
    success: boolean;
    data?: T;
    error?: E;
}
interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
        timestamp: number;
    };
    meta?: {
        version: string;
        requestId: string;
        duration: number;
        pagination?: PaginationMeta;
    };
}
interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
interface ModuleEvent {
    id: string;
    timestamp: number;
    source: string;
    type: string;
    target?: string;
    payload?: any;
    correlationId?: string;
    userId?: string;
}
type EventHandler<T = any> = (event: ModuleEvent & {
    payload: T;
}) => void | Promise<void>;
interface EventSubscription {
    id: string;
    eventType: string;
    handler: EventHandler;
    once?: boolean;
}
interface ModuleError extends Error {
    code: string;
    message: string;
    name: string;
    details?: any;
    timestamp: number;
    source?: string;
    correlationId?: string;
}
declare enum CommonErrorCodes {
    SYSTEM_INTERNAL_ERROR = "SYSTEM_900",
    SYSTEM_MAINTENANCE = "SYSTEM_901",
    SYSTEM_TIMEOUT = "SYSTEM_902",
    VALIDATION_FAILED = "VAL_800",
    INVALID_FORMAT = "VAL_801",
    REQUIRED_FIELD_MISSING = "VAL_802",
    NETWORK_ERROR = "NET_700",
    API_UNAVAILABLE = "NET_701",
    RATE_LIMIT_EXCEEDED = "NET_702"
}
declare enum LogLevel {
    DEBUG = "debug",
    INFO = "info",
    WARN = "warn",
    ERROR = "error"
}
interface LogEntry {
    timestamp: number;
    level: LogLevel;
    message: string;
    module: string;
    correlationId?: string;
    userId?: string;
    metadata?: Record<string, any>;
}
type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
interface User {
    id: string;
    email: string;
    name: string;
    roles: string[];
    permissions: string[];
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
interface Session {
    id: string;
    userId: string;
    expiresAt: Date;
    metadata?: Record<string, any>;
}
interface ModuleMessage {
    id: string;
    from: string;
    to: string;
    type: string;
    payload: any;
    timestamp: number;
    replyTo?: string;
}
interface ModuleCommunication {
    send<T>(to: string, type: string, payload: T): Promise<Result<void>>;
    subscribe<T>(type: string, handler: (message: ModuleMessage & {
        payload: T;
    }) => void): string;
    unsubscribe(subscriptionId: string): void;
}

/**
 * @company/core - 이벤트 에미터
 * 모듈 간 이벤트 기반 통신을 위한 핵심 클래스
 */

declare class EventEmitter {
    private subscriptions;
    private eventHandlers;
    /**
     * 이벤트 구독
     */
    on<T = any>(eventType: string, handler: EventHandler<T>): string;
    /**
     * 일회성 이벤트 구독
     */
    once<T = any>(eventType: string, handler: EventHandler<T>): string;
    /**
     * 이벤트 구독 해제
     */
    off(subscriptionId: string): void;
    /**
     * 이벤트 발행
     */
    emit(eventType: string, payload?: any, options?: {
        source?: string;
        target?: string;
        correlationId?: string;
        userId?: string;
    }): void;
    /**
     * 특정 이벤트 타입의 구독자 수 반환
     */
    getSubscriberCount(eventType: string): number;
    /**
     * 모든 구독 해제
     */
    removeAllListeners(eventType?: string): void;
    /**
     * 현재 활성 구독 목록 반환
     */
    getActiveSubscriptions(): EventSubscription[];
    /**
     * 구독된 이벤트 타입 목록 반환
     */
    getEventTypes(): string[];
    /**
     * 이벤트 처리
     */
    private processEvent;
    /**
     * 개별 핸들러 실행
     */
    private executeHandler;
}
declare class GlobalEventBus extends EventEmitter {
    private static instance;
    private constructor();
    static getInstance(): GlobalEventBus;
    /**
     * 모듈 이벤트 발행 (표준 형식 강제)
     */
    emitModuleEvent(source: string, eventType: string, payload?: any, options?: {
        target?: string;
        correlationId?: string;
        userId?: string;
    }): void;
}
declare const EventBus: GlobalEventBus;

/**
 * @company/core - 로거
 * 모듈별 구조화된 로깅 시스템
 */

declare class Logger {
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
declare const globalLogger: GlobalLogger;

/**
 * @company/core - 에러 핸들러
 * Zero Error Architecture를 위한 안전한 에러 처리
 */

declare class ErrorHandler {
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
declare function isModuleError(error: any): error is ModuleError;
/**
 * 안전한 에러 메시지 추출
 */
declare function getErrorMessage(error: any): string;
/**
 * 에러 코드 추출
 */
declare function getErrorCode(error: any): string;

/**
 * @company/core - 모듈 기반 클래스
 * 모든 엔터프라이즈 모듈이 상속받아야 하는 추상 클래스
 */

declare abstract class ModuleBase {
    protected config: ModuleConfig;
    protected status: ModuleStatus;
    protected eventEmitter: EventEmitter;
    protected logger: Logger;
    protected errorHandler: ErrorHandler;
    protected loadedAt?: Date;
    constructor(config: ModuleConfig);
    /**
     * 모듈 초기화 로직
     * 하위 클래스에서 반드시 구현해야 함
     */
    protected abstract onInitialize(): Promise<Result<void>>;
    /**
     * 모듈 정리 로직
     * 앱 종료 시 호출됨
     */
    protected abstract onDestroy(): Promise<Result<void>>;
    /**
     * 헬스 체크 로직
     * 모듈 상태 확인용
     */
    abstract healthCheck(): Promise<Result<boolean>>;
    /**
     * 모듈 초기화 (Zero Error)
     */
    private initialize;
    /**
     * 모듈 종료
     */
    destroy(): Promise<Result<void>>;
    /**
     * 모듈 정보 반환
     */
    getInfo(): ModuleInfo;
    /**
     * 모듈 설정 반환
     */
    getConfig(): ModuleConfig;
    /**
     * 모듈 상태 반환
     */
    getStatus(): ModuleStatus;
    /**
     * 모듈이 로드되었는지 확인
     */
    isLoaded(): boolean;
    /**
     * 모듈이 사용 가능한지 확인
     */
    isAvailable(): boolean;
    /**
     * 이벤트 구독
     */
    on(eventType: string, handler: EventHandler): string;
    /**
     * 일회성 이벤트 구독
     */
    once(eventType: string, handler: EventHandler): string;
    /**
     * 이벤트 구독 해제
     */
    off(subscriptionId: string): void;
    /**
     * 이벤트 발행 (내부용)
     */
    protected emit(eventType: string, payload?: any): void;
    private handleInitializationError;
    private getLastError;
    /**
     * 안전한 비동기 작업 실행 (Zero Error)
     */
    protected safeExecute<T>(operation: () => Promise<T>, errorMessage?: string): Promise<Result<T>>;
    /**
     * 조건부 실행 (상태 확인)
     */
    protected requireLoaded<T>(operation: () => T): Result<T>;
    /**
     * 설정 업데이트
     */
    protected updateConfig(updates: Partial<ModuleConfig>): void;
}

/**
 * @company/core - 모듈 레지스트리
 * 모든 모듈의 등록, 관리, 검색을 담당하는 중앙 레지스트리
 */

interface ModuleDependency {
    name: string;
    version?: string;
    optional?: boolean;
}
interface ModuleRegistration {
    module: ModuleBase;
    config: ModuleConfig;
    dependencies: ModuleDependency[];
    dependents: string[];
    registeredAt: Date;
}
declare class ModuleRegistry {
    private static instance;
    private modules;
    private logger;
    private errorHandler;
    private initializationOrder;
    private constructor();
    static getInstance(): ModuleRegistry;
    /**
     * 모듈 등록
     */
    register(module: ModuleBase, dependencies?: ModuleDependency[]): Promise<Result<void>>;
    /**
     * 모듈 해제
     */
    unregister(moduleName: string): Promise<Result<void>>;
    /**
     * 모듈 검색
     */
    get(moduleName: string): ModuleBase | null;
    /**
     * 모듈 존재 확인
     */
    has(moduleName: string): boolean;
    /**
     * 모듈 정보 조회
     */
    getInfo(moduleName: string): ModuleInfo | null;
    /**
     * 모든 모듈 목록 조회
     */
    getAllModules(): string[];
    /**
     * 활성 모듈 목록 조회
     */
    getActiveModules(): string[];
    /**
     * 모듈 상태 조회
     */
    getModuleStatus(moduleName: string): ModuleStatus | null;
    /**
     * 의존성 그래프 조회
     */
    getDependencyGraph(): Record<string, string[]>;
    /**
     * 모듈 초기화 순서 계산
     */
    calculateInitializationOrder(): Result<string[]>;
    /**
     * 모든 모듈 상태 확인
     */
    healthCheck(): Promise<Result<Record<string, boolean>>>;
    /**
     * 의존성 검증
     */
    private validateDependencies;
    /**
     * 의존성 관계 업데이트
     */
    private updateDependencyRelations;
    /**
     * 의존성 관계 정리
     */
    private cleanupDependencyRelations;
    /**
     * 위상 정렬 (의존성 순서 계산)
     */
    private topologicalSort;
}
declare const moduleRegistry: ModuleRegistry;

/**
 * @company/core - Enterprise AI Module System Core
 *
 * 모든 엔터프라이즈 모듈의 기반이 되는 핵심 라이브러리
 * Zero Error Architecture 기반으로 설계됨
 *
 * @version 1.0.0
 * @author Enterprise AI Team
 */

/**
 * 안전한 JSON 파싱 (Zero Error)
 */
declare function safeJsonParse<T>(json: string): {
    success: boolean;
    data?: T;
    error?: string;
};
/**
 * 안전한 JSON 문자열화 (Zero Error)
 */
declare function safeJsonStringify(obj: any): {
    success: boolean;
    data?: string;
    error?: string;
};
/**
 * 지연 실행 유틸리티
 */
declare function delay(ms: number): Promise<void>;
/**
 * 재시도 로직 (Zero Error)
 */
declare function retry<T>(operation: () => Promise<T>, options?: {
    maxAttempts?: number;
    delay?: number;
    backoff?: boolean;
}): Promise<{
    success: boolean;
    data?: T;
    error?: any;
    attempts: number;
}>;
/**
 * 타임아웃이 있는 Promise (Zero Error)
 */
declare function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<{
    success: boolean;
    data?: T;
    error?: string;
    timedOut: boolean;
}>;
/**
 * 객체 깊은 복사 (Zero Error)
 */
declare function deepClone<T>(obj: T): {
    success: boolean;
    data?: T;
    error?: string;
};
/**
 * 배열을 청크로 분할
 */
declare function chunk<T>(array: T[], size: number): T[][];
/**
 * 객체에서 null/undefined 값 제거
 */
declare function compact<T extends Record<string, any>>(obj: T): Partial<T>;
/**
 * 두 객체의 얕은 비교
 */
declare function shallowEqual(obj1: any, obj2: any): boolean;
declare const CORE_MODULE_INFO: {
    readonly name: "@company/core";
    readonly version: "1.0.0";
    readonly description: "Enterprise AI Module System - Core Foundation";
    readonly author: "Enterprise AI Team";
    readonly license: "MIT";
};

export { type ApiResponse, CORE_MODULE_INFO, CommonErrorCodes, type DeepPartial, ErrorHandler, EventBus, EventEmitter, type EventHandler, type EventSubscription, type LogEntry, LogLevel, Logger, ModuleBase, type ModuleCommunication, type ModuleConfig, type ModuleDependency, type ModuleError, type ModuleEvent, type ModuleInfo, type ModuleMessage, type ModuleRegistration, ModuleRegistry, ModuleStatus, type OptionalFields, type PaginationMeta, type RequiredFields, type Result, type Session, type User, chunk, compact, deepClone, delay, getErrorCode, getErrorMessage, globalLogger, isModuleError, moduleRegistry, retry, safeJsonParse, safeJsonStringify, shallowEqual, withTimeout };
