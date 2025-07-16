/**
 * @repo/core - 핵심 타입 정의
 * Zero Error Architecture 기반 타입 시스템
 */
export interface ModuleConfig {
    name: string;
    version: string;
    description?: string;
    dependencies?: string[];
    metadata?: Record<string, any>;
}
export interface ModuleInfo {
    config: ModuleConfig;
    status: ModuleStatus;
    loadedAt: Date;
    error?: ModuleError;
}
export declare enum ModuleStatus {
    LOADING = "loading",
    LOADED = "loaded",
    ERROR = "error",
    DISABLED = "disabled"
}
export interface Result<T, E = Error> {
    success: boolean;
    data?: T;
    error?: E;
}
export interface ApiResponse<T> {
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
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
export interface ModuleEvent {
    id: string;
    timestamp: number;
    source: string;
    type: string;
    target?: string;
    payload?: any;
    correlationId?: string;
    userId?: string;
}
export type EventHandler<T = any> = (event: ModuleEvent & {
    payload: T;
}) => void | Promise<void>;
export interface EventSubscription {
    id: string;
    eventType: string;
    handler: EventHandler;
    once?: boolean;
}
export interface ModuleError extends Error {
    code: string;
    message: string;
    name: string;
    details?: any;
    timestamp: number;
    source?: string;
    correlationId?: string;
}
export declare enum CommonErrorCodes {
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
export declare enum LogLevel {
    DEBUG = "debug",
    INFO = "info",
    WARN = "warn",
    ERROR = "error"
}
export interface LogEntry {
    timestamp: number;
    level: LogLevel;
    message: string;
    module: string;
    correlationId?: string;
    userId?: string;
    metadata?: Record<string, any>;
}
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export interface User {
    id: string;
    email: string;
    name: string;
    roles: string[];
    permissions: string[];
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export interface Session {
    id: string;
    userId: string;
    expiresAt: Date;
    metadata?: Record<string, any>;
}
export interface ModuleMessage {
    id: string;
    from: string;
    to: string;
    type: string;
    payload: any;
    timestamp: number;
    replyTo?: string;
}
export interface ModuleCommunication {
    send<T>(to: string, type: string, payload: T): Promise<Result<void>>;
    subscribe<T>(type: string, handler: (message: ModuleMessage & {
        payload: T;
    }) => void): string;
    unsubscribe(subscriptionId: string): void;
}
//# sourceMappingURL=index.d.ts.map