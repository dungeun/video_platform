import { Result } from '../types';
import { ZodError } from 'zod';
import {
  AppConfig,
  AppConfigSchema,
  ConfigValidator as IConfigValidator,
  ConfigValidationError
} from '../types';

/**
 * 설정 검증자 - Zod 스키마를 사용한 설정 검증
 */
export class ConfigValidator implements IConfigValidator {
  /**
   * 전체 설정 검증
   */
  validate(config: unknown): Result<AppConfig> {
    try {
      const validatedConfig = AppConfigSchema.parse(config);
      return Result.success(validatedConfig);
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = this.formatZodErrors(error);
        return Result.failure('CONFIG_VALIDATION_FAILED', errorMessages.join(', '));
      }
      
      const errorMsg = error instanceof Error ? error.message : 'Unknown validation error';
      return Result.failure('CONFIG_VALIDATION_ERROR', errorMsg);
    }
  }
  
  /**
   * 부분 설정 검증
   */
  validatePartial(config: unknown): Result<Partial<AppConfig>> {
    try {
      const validatedConfig = AppConfigSchema.partial().parse(config);
      return Result.success(validatedConfig);
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = this.formatZodErrors(error);
        return Result.failure('CONFIG_PARTIAL_VALIDATION_FAILED', errorMessages.join(', '));
      }
      
      const errorMsg = error instanceof Error ? error.message : 'Unknown validation error';
      return Result.failure('CONFIG_VALIDATION_ERROR', errorMsg);
    }
  }
  
  /**
   * 특정 필드 검증
   */
  validateField<K extends keyof AppConfig>(
    key: K, 
    value: unknown
  ): Result<AppConfig[K]> {
    try {
      // 필드별 스키마 추출
      const fieldSchema = AppConfigSchema.shape[key];
      if (!fieldSchema) {
        return Result.failure('FIELD_NOT_FOUND', `필드 '${String(key)}'를 찾을 수 없습니다.`);
      }
      
      const validatedValue = fieldSchema.parse(value);
      return Result.success(validatedValue);
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = this.formatZodErrors(error);
        return Result.failure('FIELD_VALIDATION_FAILED', 
          `필드 '${String(key)}' 검증 실패: ${errorMessages.join(', ')}`
        );
      }
      
      const errorMsg = error instanceof Error ? error.message : 'Unknown validation error';
      return Result.failure('FIELD_VALIDATION_ERROR', errorMsg);
    }
  }
  
  /**
   * 환경별 설정 검증
   */
  validateEnvironmentConfig(
    environment: string,
    config: unknown
  ): Result<AppConfig> {
    // 먼저 기본 검증
    const baseValidation = this.validate(config);
    if (baseValidation.isFailure) {
      return baseValidation;
    }
    
    const validatedConfig = baseValidation.data;
    
    // 환경별 특별 검증
    switch (environment) {
      case 'production':
        return this.validateProductionConfig(validatedConfig);
      case 'development':
        return this.validateDevelopmentConfig(validatedConfig);
      case 'test':
        return this.validateTestConfig(validatedConfig);
      default:
        return Result.success(validatedConfig);
    }
  }
  
  /**
   * 프로덕션 환경 설정 검증
   */
  private validateProductionConfig(config: AppConfig): Result<AppConfig> {
    const errors: string[] = [];
    
    // 디버그 모드 비활성화 확인
    if (config.debug) {
      errors.push('프로덕션 환경에서는 debug 모드를 비활성화해야 합니다.');
    }
    
    // HTTPS 사용 확인 (필요시)
    // if (!config.server.ssl) {
    //   errors.push('프로덕션 환경에서는 SSL을 사용해야 합니다.');
    // }
    
    // 보안 설정 확인
    if (config.auth.jwtSecret.length < 32) {
      errors.push('JWT 비밀키는 최소 32자 이상이어야 합니다.');
    }
    
    if (config.database.ssl === false) {
      errors.push('프로덕션 환경에서는 데이터베이스 SSL 연결을 사용해야 합니다.');
    }
    
    if (errors.length > 0) {
      return Result.failure('PRODUCTION_CONFIG_INVALID', errors.join('; '));
    }
    
    return Result.success(config);
  }
  
  /**
   * 개발 환경 설정 검증
   */
  private validateDevelopmentConfig(config: AppConfig): Result<AppConfig> {
    // 개발 환경에서는 대부분의 설정이 유연함
    return Result.success(config);
  }
  
  /**
   * 테스트 환경 설정 검증
   */
  private validateTestConfig(config: AppConfig): Result<AppConfig> {
    const errors: string[] = [];
    
    // 테스트 데이터베이스 사용 확인
    if (!config.database.database.includes('test')) {
      errors.push('테스트 환경에서는 테스트 데이터베이스를 사용해야 합니다.');
    }
    
    if (errors.length > 0) {
      return Result.failure('TEST_CONFIG_INVALID', errors.join('; '));
    }
    
    return Result.success(config);
  }
  
  /**
   * Zod 오류 포맷팅
   */
  private formatZodErrors(error: ZodError): string[] {
    return error.errors.map(err => {
      const path = err.path.length > 0 ? err.path.join('.') : 'root';
      return `${path}: ${err.message}`;
    });
  }
  
  /**
   * 설정 스키마 정보 조회
   */
  getSchema() {
    return AppConfigSchema;
  }
  
  /**
   * 설정 예시 생성
   */
  generateExample(): Partial<AppConfig> {
    return {
      name: 'my-app',
      version: '1.0.0',
      environment: 'development',
      debug: true,
      server: {
        host: 'localhost',
        port: 3000,
        cors: {
          enabled: true,
          origins: ['http://localhost:3000'],
          credentials: true
        }
      },
      database: {
        host: 'localhost',
        port: 5432,
        username: 'user',
        password: 'password',
        database: 'myapp_development',
        ssl: false,
        maxConnections: 10,
        timeout: 30000
      },
      auth: {
        jwtSecret: 'your-super-secret-jwt-key-32-chars',
        jwtExpiry: '24h',
        bcryptRounds: 12,
        sessionTimeout: 3600,
        maxLoginAttempts: 5,
        lockoutDuration: 900
      },
      storage: {
        provider: 'local',
        basePath: './uploads',
        maxFileSize: 10485760,
        allowedMimeTypes: ['image/*', 'application/pdf']
      },
      email: {
        provider: 'smtp',
        host: 'localhost',
        port: 587,
        username: 'test@example.com',
        password: 'password',
        from: 'noreply@example.com'
      },
      cache: {
        provider: 'memory',
        ttl: 3600,
        maxSize: 104857600,
        compression: false
      },
      payment: {
        providers: {
          stripe: {
            enabled: false
          }
        },
        currency: 'USD',
        taxRate: 0.1
      },
      features: {
        registration: true,
        socialLogin: false,
        twoFactorAuth: false,
        analytics: true,
        maintenance: false
      }
    };
  }
}