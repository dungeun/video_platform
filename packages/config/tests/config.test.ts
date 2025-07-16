import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConfigManager, ConfigValidator, parseEnvValue } from '../src';
import { AppConfig } from '../src/types';

describe('@repo/config', () => {
  let configManager: ConfigManager;
  
  beforeEach(() => {
    configManager = new ConfigManager({
      sources: [
        { type: 'env', priority: 100 }
      ],
      hotReload: false,
      validateOnLoad: true,
      throwOnValidationError: false
    });
  });
  
  afterEach(() => {
    configManager?.dispose();
  });
  
  describe('ConfigManager', () => {
    it('설정을 성공적으로 로드해야 한다', async () => {
      // 테스트용 환경변수 설정
      process.env.APP_NAME = 'test-app';
      process.env.APP_VERSION = '1.0.0';
      process.env.NODE_ENV = 'test';
      process.env.DEBUG = 'true';
      process.env.SERVER_HOST = 'localhost';
      process.env.SERVER_PORT = '3000';
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';
      process.env.DB_USERNAME = 'test';
      process.env.DB_PASSWORD = 'test';
      process.env.DB_DATABASE = 'test_db';
      process.env.JWT_SECRET = 'test-super-secret-jwt-key-32-chars';
      process.env.EMAIL_FROM = 'test@example.com';
      
      const result = await configManager.load();
      
      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        const config = result.data;
        expect(config.name).toBe('test-app');
        expect(config.version).toBe('1.0.0');
        expect(config.environment).toBe('test');
        expect(config.debug).toBe(true);
        expect(config.server.host).toBe('localhost');
        expect(config.server.port).toBe(3000);
        expect(config.database.host).toBe('localhost');
        expect(config.database.port).toBe(5432);
      }
    });
    
    it('설정 값을 올바르게 조회해야 한다', async () => {
      process.env.APP_NAME = 'test-app';
      process.env.SERVER_PORT = '8080';
      process.env.JWT_SECRET = 'test-super-secret-jwt-key-32-chars';
      process.env.EMAIL_FROM = 'test@example.com';
      
      await configManager.load();
      
      const appName = configManager.get('name');
      const serverConfig = configManager.get('server');
      
      expect(appName).toBe('test-app');
      expect(serverConfig?.port).toBe(8080);
    });
    
    it('전체 설정을 올바르게 조회해야 한다', async () => {
      process.env.APP_NAME = 'test-app';
      process.env.JWT_SECRET = 'test-super-secret-jwt-key-32-chars';
      process.env.EMAIL_FROM = 'test@example.com';
      
      await configManager.load();
      
      const allConfig = configManager.getAll();
      
      expect(allConfig).toBeDefined();
      expect(allConfig.name).toBe('test-app');
      expect(typeof allConfig.server).toBe('object');
      expect(typeof allConfig.database).toBe('object');
    });
    
    it('메타데이터를 올바르게 제공해야 한다', async () => {
      process.env.APP_NAME = 'test-app';
      process.env.NODE_ENV = 'test';
      process.env.JWT_SECRET = 'test-super-secret-jwt-key-32-chars';
      process.env.EMAIL_FROM = 'test@example.com';
      
      await configManager.load();
      
      const metadata = configManager.getMetadata();
      
      expect(metadata).toBeDefined();
      expect(metadata.version).toBe('1.0.0');
      expect(metadata.environment).toBe('test');
      expect(metadata.loadedAt).toBeInstanceOf(Date);
      expect(metadata.sources).toBeDefined();
      expect(metadata.hash).toBeDefined();
    });
  });
  
  describe('ConfigValidator', () => {
    let validator: ConfigValidator;
    
    beforeEach(() => {
      validator = new ConfigValidator();
    });
    
    it('올바른 설정을 검증해야 한다', () => {
      const validConfig = {
        name: 'test-app',
        version: '1.0.0',
        environment: 'test',
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
          username: 'test',
          password: 'test',
          database: 'test_db',
          ssl: false,
          maxConnections: 10,
          timeout: 30000
        },
        auth: {
          jwtSecret: 'test-super-secret-jwt-key-32-chars',
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
          allowedMimeTypes: ['image/*']
        },
        email: {
          provider: 'smtp',
          host: 'localhost',
          port: 587,
          from: 'test@example.com'
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
      
      const result = validator.validate(validConfig);
      
      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.data.name).toBe('test-app');
        expect(result.data.environment).toBe('test');
      }
    });
    
    it('잘못된 설정을 거부해야 한다', () => {
      const invalidConfig = {
        name: '', // 빈 문자열
        version: '1.0.0',
        environment: 'invalid-env', // 잘못된 환경
        server: {
          port: 'not-a-number' // 잘못된 타입
        }
      };
      
      const result = validator.validate(invalidConfig);
      
      expect(result.isFailure).toBe(true);
      expect(result.message).toContain('name');
    });
    
    it('부분 설정을 검증해야 한다', () => {
      const partialConfig = {
        name: 'test-app',
        server: {
          port: 3000
        }
      };
      
      const result = validator.validatePartial(partialConfig);
      
      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.data.name).toBe('test-app');
        expect(result.data.server?.port).toBe(3000);
      }
    });
    
    it('예시 설정을 생성해야 한다', () => {
      const example = validator.generateExample();
      
      expect(example).toBeDefined();
      expect(example.name).toBe('my-app');
      expect(example.version).toBe('1.0.0');
      expect(example.environment).toBe('development');
      expect(example.server?.port).toBe(3000);
    });
  });
  
  describe('parseEnvValue', () => {
    it('불리언 값을 올바르게 파싱해야 한다', () => {
      expect(parseEnvValue.boolean('true')).toBe(true);
      expect(parseEnvValue.boolean('false')).toBe(false);
      expect(parseEnvValue.boolean('1')).toBe(true);
      expect(parseEnvValue.boolean('0')).toBe(false);
      expect(parseEnvValue.boolean('yes')).toBe(true);
      expect(parseEnvValue.boolean('no')).toBe(false);
      expect(parseEnvValue.boolean('invalid')).toBe(undefined);
      expect(parseEnvValue.boolean('')).toBe(undefined);
      expect(parseEnvValue.boolean(undefined)).toBe(undefined);
    });
    
    it('숫자 값을 올바르게 파싱해야 한다', () => {
      expect(parseEnvValue.number('123')).toBe(123);
      expect(parseEnvValue.number('123.45')).toBe(123.45);
      expect(parseEnvValue.number('0')).toBe(0);
      expect(parseEnvValue.number('-123')).toBe(-123);
      expect(parseEnvValue.number('not-a-number')).toBe(undefined);
      expect(parseEnvValue.number('')).toBe(undefined);
      expect(parseEnvValue.number(undefined)).toBe(undefined);
    });
    
    it('배열 값을 올바르게 파싱해야 한다', () => {
      expect(parseEnvValue.array('a,b,c')).toEqual(['a', 'b', 'c']);
      expect(parseEnvValue.array('a, b, c')).toEqual(['a', 'b', 'c']);
      expect(parseEnvValue.array('a')).toEqual(['a']);
      expect(parseEnvValue.array('')).toBe(undefined);
      expect(parseEnvValue.array(undefined)).toBe(undefined);
    });
    
    it('JSON 값을 올바르게 파싱해야 한다', () => {
      expect(parseEnvValue.json('{"key": "value"}')).toEqual({ key: 'value' });
      expect(parseEnvValue.json('[1, 2, 3]')).toEqual([1, 2, 3]);
      expect(parseEnvValue.json('invalid-json')).toBe(undefined);
      expect(parseEnvValue.json('')).toBe(undefined);
      expect(parseEnvValue.json(undefined)).toBe(undefined);
    });
    
    it('기간 값을 올바르게 파싱해야 한다', () => {
      expect(parseEnvValue.duration('1000')).toBe(1000);
      expect(parseEnvValue.duration('1s')).toBe(1000);
      expect(parseEnvValue.duration('1m')).toBe(60000);
      expect(parseEnvValue.duration('1h')).toBe(3600000);
      expect(parseEnvValue.duration('1d')).toBe(86400000);
      expect(parseEnvValue.duration('invalid')).toBe(undefined);
    });
    
    it('바이트 값을 올바르게 파싱해야 한다', () => {
      expect(parseEnvValue.bytes('1024')).toBe(1024);
      expect(parseEnvValue.bytes('1KB')).toBe(1024);
      expect(parseEnvValue.bytes('1MB')).toBe(1048576);
      expect(parseEnvValue.bytes('1GB')).toBe(1073741824);
      expect(parseEnvValue.bytes('invalid')).toBe(undefined);
    });
  });
  
  // 테스트 후 환경변수 정리
  afterEach(() => {
    const envKeys = [
      'APP_NAME', 'APP_VERSION', 'NODE_ENV', 'DEBUG',
      'SERVER_HOST', 'SERVER_PORT',
      'DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE',
      'JWT_SECRET', 'EMAIL_FROM'
    ];
    
    envKeys.forEach(key => {
      delete process.env[key];
    });
  });
});