/**
 * @repo/core - 핵심 타입 정의
 * Zero Error Architecture 기반 타입 시스템
 */

// ===== 모듈 기본 타입 =====

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

export enum ModuleStatus {
  LOADING = 'loading',
  LOADED = 'loaded',
  ERROR = 'error',
  DISABLED = 'disabled'
}

// ===== 결과 타입 (Zero Error) =====

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

// ===== 이벤트 시스템 =====

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

export type EventHandler<T = any> = (event: ModuleEvent & { payload: T }) => void | Promise<void>;

export interface EventSubscription {
  id: string;
  eventType: string;
  handler: EventHandler;
  once?: boolean;
}

// ===== 에러 시스템 =====

export interface ModuleError extends Error {
  code: string;
  message: string;
  name: string;
  details?: any;
  timestamp: number;
  source?: string;
  correlationId?: string;
}

export enum CommonErrorCodes {
  // System Errors (900~999)
  SYSTEM_INTERNAL_ERROR = 'SYSTEM_900',
  SYSTEM_MAINTENANCE = 'SYSTEM_901',
  SYSTEM_TIMEOUT = 'SYSTEM_902',
  
  // Validation Errors (800~899)
  VALIDATION_FAILED = 'VAL_800',
  INVALID_FORMAT = 'VAL_801',
  REQUIRED_FIELD_MISSING = 'VAL_802',
  
  // Network Errors (700~799)
  NETWORK_ERROR = 'NET_700',
  API_UNAVAILABLE = 'NET_701',
  RATE_LIMIT_EXCEEDED = 'NET_702'
}

// ===== 로깅 시스템 =====

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
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

// ===== 유틸리티 타입 =====

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// ===== 인증/인가 기본 타입 =====

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

// ===== 모듈 간 통신 타입 =====

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
  subscribe<T>(type: string, handler: (message: ModuleMessage & { payload: T }) => void): string;
  unsubscribe(subscriptionId: string): void;
}