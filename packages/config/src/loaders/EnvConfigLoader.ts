import { Result } from '../types';
import dotenv from 'dotenv';
import { ConfigLoader, AppConfig } from '../types';
import { parseEnvValue } from '../utils/EnvParser';

/**
 * 환경변수 설정 로더
 */
export class EnvConfigLoader implements ConfigLoader {
  readonly priority = 100; // 가장 높은 우선순위
  
  constructor() {
    // .env 파일 로드
    dotenv.config();
  }
  
  /**
   * 환경변수에서 설정 로드
   */
  async load(): Promise<Result<Partial<AppConfig>>> {
    try {
      const env = process.env;
      
      const config: Partial<AppConfig> = {
        // 애플리케이션 기본 설정
        name: env['APP_NAME'],
        version: env['APP_VERSION'],
        environment: this.parseEnvironment(env['NODE_ENV']),
        debug: parseEnvValue.boolean(env['DEBUG']),
        
        // 서버 설정
        server: {
          host: env['SERVER_HOST'],
          port: parseEnvValue.number(env['SERVER_PORT']),
          cors: {
            enabled: parseEnvValue.boolean(env['CORS_ENABLED']),
            origins: parseEnvValue.array(env['CORS_ORIGINS']),
            credentials: parseEnvValue.boolean(env['CORS_CREDENTIALS'])
          }
        },
        
        // 데이터베이스 설정
        database: {
          host: env['DB_HOST'],
          port: parseEnvValue.number(env['DB_PORT']),
          username: env['DB_USERNAME'] || env['DB_USER'],
          password: env['DB_PASSWORD'],
          database: env['DB_DATABASE'] || env['DB_NAME'],
          ssl: parseEnvValue.boolean(env['DB_SSL']),
          maxConnections: parseEnvValue.number(env['DB_MAX_CONNECTIONS']),
          timeout: parseEnvValue.number(env['DB_TIMEOUT'])
        },
        
        // 인증 설정
        auth: {
          jwtSecret: env['JWT_SECRET'],
          jwtExpiry: env['JWT_EXPIRY'],
          bcryptRounds: parseEnvValue.number(env['BCRYPT_ROUNDS']),
          sessionTimeout: parseEnvValue.number(env['SESSION_TIMEOUT']),
          maxLoginAttempts: parseEnvValue.number(env['MAX_LOGIN_ATTEMPTS']),
          lockoutDuration: parseEnvValue.number(env['LOCKOUT_DURATION'])
        },
        
        // 스토리지 설정
        storage: {
          provider: this.parseStorageProvider(env['STORAGE_PROVIDER']),
          basePath: env['STORAGE_BASE_PATH'],
          maxFileSize: parseEnvValue.number(env['STORAGE_MAX_FILE_SIZE']),
          allowedMimeTypes: parseEnvValue.array(env['STORAGE_ALLOWED_MIME_TYPES']),
          cdn: env['CDN_ENABLED'] ? {
            enabled: parseEnvValue.boolean(env['CDN_ENABLED']),
            url: env['CDN_URL'],
            cacheTtl: parseEnvValue.number(env['CDN_CACHE_TTL'])
          } : undefined
        },
        
        // 이메일 설정
        email: {
          provider: this.parseEmailProvider(env['EMAIL_PROVIDER']),
          host: env['EMAIL_HOST'] || env['SMTP_HOST'],
          port: parseEnvValue.number(env['EMAIL_PORT'] || env['SMTP_PORT']),
          username: env['EMAIL_USERNAME'] || env['SMTP_USERNAME'],
          password: env['EMAIL_PASSWORD'] || env['SMTP_PASSWORD'],
          apiKey: env['EMAIL_API_KEY'],
          from: env['EMAIL_FROM'],
          replyTo: env['EMAIL_REPLY_TO']
        },
        
        // 캐시 설정
        cache: {
          provider: this.parseCacheProvider(env['CACHE_PROVIDER']),
          host: env['CACHE_HOST'] || env['REDIS_HOST'],
          port: parseEnvValue.number(env['CACHE_PORT'] || env['REDIS_PORT']),
          password: env['CACHE_PASSWORD'] || env['REDIS_PASSWORD'],
          ttl: parseEnvValue.number(env['CACHE_TTL']),
          maxSize: parseEnvValue.number(env['CACHE_MAX_SIZE']),
          compression: parseEnvValue.boolean(env['CACHE_COMPRESSION'])
        },
        
        // 결제 설정
        payment: {
          providers: {
            stripe: {
              enabled: parseEnvValue.boolean(env['STRIPE_ENABLED']),
              publishableKey: env['STRIPE_PUBLISHABLE_KEY'],
              secretKey: env['STRIPE_SECRET_KEY'],
              webhookSecret: env['STRIPE_WEBHOOK_SECRET']
            },
            paypal: {
              enabled: parseEnvValue.boolean(env['PAYPAL_ENABLED']),
              clientId: env['PAYPAL_CLIENT_ID'],
              clientSecret: env['PAYPAL_CLIENT_SECRET'],
              sandbox: parseEnvValue.boolean(env['PAYPAL_SANDBOX'])
            }
          },
          currency: env['PAYMENT_CURRENCY'],
          taxRate: parseEnvValue.number(env['TAX_RATE'])
        },
        
        // 기능 플래그
        features: {
          registration: parseEnvValue.boolean(env['FEATURE_REGISTRATION']),
          socialLogin: parseEnvValue.boolean(env['FEATURE_SOCIAL_LOGIN']),
          twoFactorAuth: parseEnvValue.boolean(env['FEATURE_2FA']),
          analytics: parseEnvValue.boolean(env['FEATURE_ANALYTICS']),
          maintenance: parseEnvValue.boolean(env['MAINTENANCE_MODE'])
        }
      };
      
      // undefined 값 제거
      const cleanedConfig = this.removeUndefinedValues(config);
      
      return Result.success(cleanedConfig);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      return Result.failure('ENV_LOAD_FAILED', `환경변수 로드 실패: ${errorMsg}`);
    }
  }
  
  /**
   * 환경 파싱
   */
  private parseEnvironment(env?: string): 'development' | 'staging' | 'production' | 'test' {
    switch (env?.toLowerCase()) {
      case 'dev':
      case 'development':
        return 'development';
      case 'stage':
      case 'staging':
        return 'staging';
      case 'prod':
      case 'production':
        return 'production';
      case 'test':
        return 'test';
      default:
        return 'development';
    }
  }
  
  /**
   * 스토리지 프로바이더 파싱
   */
  private parseStorageProvider(provider?: string): 'local' | 'aws-s3' | 'gcp-storage' | 'azure-blob' {
    switch (provider?.toLowerCase()) {
      case 's3':
      case 'aws-s3':
        return 'aws-s3';
      case 'gcp':
      case 'gcp-storage':
        return 'gcp-storage';
      case 'azure':
      case 'azure-blob':
        return 'azure-blob';
      default:
        return 'local';
    }
  }
  
  /**
   * 이메일 프로바이더 파싱
   */
  private parseEmailProvider(provider?: string): 'smtp' | 'sendgrid' | 'mailgun' | 'ses' {
    switch (provider?.toLowerCase()) {
      case 'sendgrid':
        return 'sendgrid';
      case 'mailgun':
        return 'mailgun';
      case 'ses':
      case 'aws-ses':
        return 'ses';
      default:
        return 'smtp';
    }
  }
  
  /**
   * 캐시 프로바이더 파싱
   */
  private parseCacheProvider(provider?: string): 'memory' | 'redis' | 'memcached' {
    switch (provider?.toLowerCase()) {
      case 'redis':
        return 'redis';
      case 'memcached':
        return 'memcached';
      default:
        return 'memory';
    }
  }
  
  /**
   * undefined 값 제거 (재귀적)
   */
  private removeUndefinedValues<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.filter(item => item !== undefined).map(item => this.removeUndefinedValues(item)) as T;
    }
    
    const cleaned = {} as T;
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (value !== undefined) {
        if (typeof value === 'object') {
          (cleaned as any)[key] = this.removeUndefinedValues(value);
        } else {
          (cleaned as any)[key] = value;
        }
      }
    }
    
    return cleaned;
  }
}