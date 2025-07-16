/**
 * @company/core - Enterprise AI Module System Core
 *
 * 모든 엔터프라이즈 모듈의 기반이 되는 핵심 라이브러리
 * Zero Error Architecture 기반으로 설계됨
 *
 * @version 1.0.0
 * @author Enterprise AI Team
 */
export * from './types';
export { ModuleBase } from './base/ModuleBase';
export { EventEmitter, EventBus } from './events/EventEmitter';
export { ErrorHandler, isModuleError, getErrorMessage, getErrorCode } from './error/ErrorHandler';
export { Logger, globalLogger } from './logging/Logger';
export { ModuleRegistry, moduleRegistry, type ModuleDependency, type ModuleRegistration } from './registry/ModuleRegistry';
/**
 * 안전한 JSON 파싱 (Zero Error)
 */
export declare function safeJsonParse<T>(json: string): {
    success: boolean;
    data?: T;
    error?: string;
};
/**
 * 안전한 JSON 문자열화 (Zero Error)
 */
export declare function safeJsonStringify(obj: any): {
    success: boolean;
    data?: string;
    error?: string;
};
/**
 * 지연 실행 유틸리티
 */
export declare function delay(ms: number): Promise<void>;
/**
 * 재시도 로직 (Zero Error)
 */
export declare function retry<T>(operation: () => Promise<T>, options?: {
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
export declare function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<{
    success: boolean;
    data?: T;
    error?: string;
    timedOut: boolean;
}>;
/**
 * 객체 깊은 복사 (Zero Error)
 */
export declare function deepClone<T>(obj: T): {
    success: boolean;
    data?: T;
    error?: string;
};
/**
 * 배열을 청크로 분할
 */
export declare function chunk<T>(array: T[], size: number): T[][];
/**
 * 객체에서 null/undefined 값 제거
 */
export declare function compact<T extends Record<string, any>>(obj: T): Partial<T>;
/**
 * 두 객체의 얕은 비교
 */
export declare function shallowEqual(obj1: any, obj2: any): boolean;
export declare const CORE_MODULE_INFO: {
    readonly name: "@company/core";
    readonly version: "1.0.0";
    readonly description: "Enterprise AI Module System - Core Foundation";
    readonly author: "Enterprise AI Team";
    readonly license: "MIT";
};
//# sourceMappingURL=index.d.ts.map