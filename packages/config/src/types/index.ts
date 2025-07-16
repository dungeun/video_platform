/**
 * @repo/config - Configuration Management Types
 * 
 * 환경 설정 관리를 위한 타입 정의
 * - 다양한 환경 지원 (dev, staging, prod)
 * - 스키마 기반 검증
 * - Hot reload 지원
 * 
 * @version 1.0.0
 */

import { z } from 'zod';

// ===== Result 타입 (자체 정의) =====
export class Result<T, E = Error> {
  constructor(
    public readonly success: boolean,
    public readonly data?: T,
    public readonly error?: E,
    public readonly message?: string,
    public readonly code?: string
  ) {}
  
  get isSuccess(): boolean {
    return this.success;
  }
  
  get isFailure(): boolean {
    return !this.success;
  }
  
  static success<T>(data: T): Result<T> {
    return new Result(true, data);
  }
  
  static failure<E = Error>(code: string, message: string, error?: E): Result<never, E> {
    return new Result(false, undefined, error, message, code);
  }
}

// ===== 기본 타입 =====

export type Environment = 'development' | 'staging' | 'production' | 'test';

export interface ConfigSource {
  type: 'env' | 'file' | 'remote' | 'inline';
  path?: string;
  url?: string;
  priority: number;
}

export interface ConfigMetadata {
  version: string;
  environment: Environment;
  loadedAt: Date;
  sources: ConfigSource[];
  hash: string;
}

// ===== 설정 스키마 =====

export const DatabaseConfigSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535),
  username: z.string().min(1),
  password: z.string().min(1),
  database: z.string().min(1),
  ssl: z.boolean().default(false),
  maxConnections: z.number().int().min(1).default(10),
  timeout: z.number().int().min(1000).default(30000)
});

export const AuthConfigSchema = z.object({
  jwtSecret: z.string().min(32),
  jwtExpiry: z.string().default('24h'),
  bcryptRounds: z.number().int().min(8).max(15).default(12),
  sessionTimeout: z.number().int().min(300).default(3600),
  maxLoginAttempts: z.number().int().min(1).default(5),
  lockoutDuration: z.number().int().min(60).default(900)
});

export const StorageConfigSchema = z.object({
  provider: z.enum(['local', 'aws-s3', 'gcp-storage', 'azure-blob']),
  basePath: z.string().default('./uploads'),
  maxFileSize: z.number().int().min(1024).default(10485760), // 10MB
  allowedMimeTypes: z.array(z.string()).default(['image/*', 'application/pdf']),
  cdn: z.object({
    enabled: z.boolean().default(false),
    url: z.string().url().optional(),
    cacheTtl: z.number().int().min(60).default(3600)
  }).optional()
});

export const EmailConfigSchema = z.object({
  provider: z.enum(['smtp', 'sendgrid', 'mailgun', 'ses']),
  host: z.string().optional(),
  port: z.number().int().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  apiKey: z.string().optional(),
  from: z.string().email(),
  replyTo: z.string().email().optional(),
  templates: z.object({
    welcome: z.string(),
    passwordReset: z.string(),
    orderConfirmation: z.string()
  }).optional()
});

export const CacheConfigSchema = z.object({
  provider: z.enum(['memory', 'redis', 'memcached']),
  host: z.string().optional(),
  port: z.number().int().optional(),
  password: z.string().optional(),
  ttl: z.number().int().min(60).default(3600),
  maxSize: z.number().int().min(1024).default(104857600), // 100MB
  compression: z.boolean().default(false)
});

export const PaymentConfigSchema = z.object({
  providers: z.object({
    stripe: z.object({
      enabled: z.boolean().default(false),
      publishableKey: z.string().optional(),
      secretKey: z.string().optional(),
      webhookSecret: z.string().optional()
    }).optional(),
    paypal: z.object({
      enabled: z.boolean().default(false),
      clientId: z.string().optional(),
      clientSecret: z.string().optional(),
      sandbox: z.boolean().default(true)
    }).optional()
  }),
  currency: z.string().length(3).default('USD'),
  taxRate: z.number().min(0).max(1).default(0.1)
});

export const AppConfigSchema = z.object({
  // 애플리케이션 기본 설정
  name: z.string().min(1),
  version: z.string().min(1),
  environment: z.enum(['development', 'staging', 'production', 'test']),
  debug: z.boolean().default(false),
  
  // 서버 설정
  server: z.object({
    host: z.string().default('localhost'),
    port: z.number().int().min(1).max(65535).default(3000),
    cors: z.object({
      enabled: z.boolean().default(true),
      origins: z.array(z.string()).default(['*']),
      credentials: z.boolean().default(true)
    })
  }),
  
  // 모듈별 설정
  database: DatabaseConfigSchema,
  auth: AuthConfigSchema,
  storage: StorageConfigSchema,
  email: EmailConfigSchema,
  cache: CacheConfigSchema,
  payment: PaymentConfigSchema,
  
  // 기능 플래그
  features: z.object({
    registration: z.boolean().default(true),
    socialLogin: z.boolean().default(false),
    twoFactorAuth: z.boolean().default(false),
    analytics: z.boolean().default(true),
    maintenance: z.boolean().default(false)
  }).default({})
});

// ===== 타입 정의 =====

export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;
export type AuthConfig = z.infer<typeof AuthConfigSchema>;
export type StorageConfig = z.infer<typeof StorageConfigSchema>;
export type EmailConfig = z.infer<typeof EmailConfigSchema>;
export type CacheConfig = z.infer<typeof CacheConfigSchema>;
export type PaymentConfig = z.infer<typeof PaymentConfigSchema>;
export type AppConfig = z.infer<typeof AppConfigSchema>;

// ===== 설정 로더 인터페이스 =====

export interface ConfigLoader {
  load(): Promise<Result<Partial<AppConfig>>>;
  watch?(callback: (config: Partial<AppConfig>) => void): void;
  priority: number;
}

export interface ConfigValidator {
  validate(config: unknown): Result<AppConfig>;
  validatePartial(config: unknown): Result<Partial<AppConfig>>;
}

export interface ConfigManager {
  load(): Promise<Result<AppConfig>>;
  get<K extends keyof AppConfig>(key: K): AppConfig[K] | undefined;
  getAll(): AppConfig;
  reload(): Promise<Result<AppConfig>>;
  watch(callback: (config: AppConfig) => void): void;
  getMetadata(): ConfigMetadata;
}

// ===== 이벤트 타입 =====

export interface ConfigChangeEvent {
  type: 'loaded' | 'reloaded' | 'error';
  config?: AppConfig;
  error?: Error;
  timestamp: Date;
  source?: ConfigSource;
}

export type ConfigEventListener = (event: ConfigChangeEvent) => void;

// ===== 에러 타입 =====

export class ConfigValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: unknown,
    public expectedType: string
  ) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

export class ConfigLoadError extends Error {
  constructor(
    message: string,
    public source: ConfigSource,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ConfigLoadError';
  }
}

// ===== 유틸리티 타입 =====

export interface ConfigOptions {
  sources?: ConfigSource[];
  hotReload?: boolean;
  validateOnLoad?: boolean;
  throwOnValidationError?: boolean;
  defaultEnvironment?: Environment;
}

export interface EnvironmentOverride {
  [key: string]: string | number | boolean | EnvironmentOverride;
}

// ===== 컨텍스트 타입 =====

export interface ConfigContext {
  environment: Environment;
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;
  config: AppConfig;
  metadata: ConfigMetadata;
}

// ===== 상수 =====

export const DEFAULT_CONFIG_SOURCES: ConfigSource[] = [
  { type: 'env', priority: 100 },
  { type: 'file', path: '.env', priority: 90 },
  { type: 'file', path: 'config.json', priority: 80 },
  { type: 'file', path: 'config.yaml', priority: 70 }
];

export const CONFIG_FILE_PATTERNS = [
  '.env',
  '.env.local',
  '.env.development',
  '.env.staging', 
  '.env.production',
  'config.json',
  'config.yaml',
  'config.yml',
  'app.config.js',
  'app.config.ts'
];

export const SENSITIVE_CONFIG_KEYS = [
  'password',
  'secret',
  'key',
  'token',
  'api_key',
  'private_key',
  'jwt_secret'
];