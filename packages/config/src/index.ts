/**
 * @company/config - Configuration Management Module
 * 
 * 다양한 환경별 설정을 관리하는 설정 모듈
 * - 환경변수, 파일, 원격 소스 지원
 * - Zod 스키마 기반 검증
 * - Hot reload 지원
 * - Zero Error Architecture
 * 
 * @version 1.0.0
 * @author Enterprise AI Team
 */

// ===== 메인 클래스 =====
export { ConfigManager } from './ConfigManager';

// ===== 검증자 =====
export { ConfigValidator } from './validators/ConfigValidator';

// ===== 로더 =====
export { EnvConfigLoader } from './loaders/EnvConfigLoader';
export { FileConfigLoader } from './loaders/FileConfigLoader';

// ===== 유틸리티 =====
export * from './utils/EnvParser';

// ===== 타입 정의 =====
export type {
  // 메인 설정 타입
  AppConfig,
  Environment,
  
  // 세부 설정 타입
  DatabaseConfig,
  AuthConfig,
  StorageConfig,
  EmailConfig,
  CacheConfig,
  PaymentConfig,
  
  // 인터페이스
  ConfigManager as IConfigManager,
  ConfigLoader,
  ConfigValidator as IConfigValidator,
  
  // 메타데이터
  ConfigSource,
  ConfigMetadata,
  ConfigOptions,
  ConfigContext,
  
  // 이벤트
  ConfigChangeEvent,
  ConfigEventListener,
  
  // 유틸리티
  EnvironmentOverride
} from './types';

// ===== 스키마 =====
export {
  AppConfigSchema,
  DatabaseConfigSchema,
  AuthConfigSchema,
  StorageConfigSchema,
  EmailConfigSchema,
  CacheConfigSchema,
  PaymentConfigSchema
} from './types';

// ===== 에러 클래스 =====
export {
  ConfigValidationError,
  ConfigLoadError
} from './types';

// ===== 상수 =====
export {
  DEFAULT_CONFIG_SOURCES,
  CONFIG_FILE_PATTERNS,
  SENSITIVE_CONFIG_KEYS
} from './types';

// ===== 팩토리 함수 =====

import { ConfigManager } from './ConfigManager';
import { ConfigOptions, AppConfig, Result, Environment } from './types';

/**
 * 기본 설정 매니저 생성
 */
export function createConfigManager(options?: ConfigOptions): ConfigManager {
  return new ConfigManager(options);
}

/**
 * 전역 설정 매니저 인스턴스
 */
let globalConfigManager: ConfigManager | null = null;

/**
 * 전역 설정 매니저 초기화
 */
export function initializeGlobalConfig(options?: ConfigOptions): Promise<Result<AppConfig>> {
  globalConfigManager = createConfigManager(options);
  return globalConfigManager.load();
}

/**
 * 전역 설정 매니저 조회
 */
export function getGlobalConfig(): ConfigManager {
  if (!globalConfigManager) {
    throw new Error('전역 설정이 초기화되지 않았습니다. initializeGlobalConfig()를 먼저 호출하세요.');
  }
  return globalConfigManager;
}

/**
 * 전역 설정 값 조회
 */
export function getConfig<K extends keyof AppConfig>(key?: K): K extends undefined ? AppConfig : AppConfig[K] {
  const manager = getGlobalConfig();
  
  if (key === undefined) {
    return manager.getAll() as any;
  }
  
  const value = manager.get(key);
  if (value === undefined) {
    throw new Error(`설정 키 '${String(key)}'를 찾을 수 없습니다.`);
  }
  
  return value as any;
}

/**
 * 전역 설정 재로드
 */
export function reloadGlobalConfig(): Promise<Result<AppConfig>> {
  const manager = getGlobalConfig();
  return manager.reload();
}

// ===== 환경별 헬퍼 =====

/**
 * 현재 환경 확인
 */
export function getCurrentEnvironment(): Environment {
  try {
    return getConfig('environment');
  } catch {
    return 'development' as Environment;
  }
}

/**
 * 프로덕션 환경 여부
 */
export function isProduction(): boolean {
  return getCurrentEnvironment() === 'production';
}

/**
 * 개발 환경 여부
 */
export function isDevelopment(): boolean {
  return getCurrentEnvironment() === 'development';
}

/**
 * 테스트 환경 여부
 */
export function isTest(): boolean {
  return getCurrentEnvironment() === 'test';
}

/**
 * 디버그 모드 여부
 */
export function isDebugMode(): boolean {
  try {
    return getConfig('debug');
  } catch {
    return false;
  }
}

// ===== 사용 예시 =====

/**
 * 예시 사용법 함수
 */
export async function exampleUsage() {
  // 1. 전역 설정 초기화
  const result = await initializeGlobalConfig({
    sources: [
      { type: 'env', priority: 100 },
      { type: 'file', path: '.env', priority: 90 },
      { type: 'file', path: 'config.json', priority: 80 }
    ],
    hotReload: true,
    validateOnLoad: true
  });
  
  if (result.isFailure) {
    console.error('설정 로드 실패:', result.message);
    return;
  }
  
  // 2. 설정 사용
  const dbConfig = getConfig('database');
  const serverPort = getConfig('server').port;
  const allConfig = getConfig();
  
  console.log('데이터베이스 호스트:', dbConfig.host);
  console.log('서버 포트:', serverPort);
  console.log('전체 설정:', allConfig);
  
  // 3. 환경 확인
  if (isProduction()) {
    console.log('프로덕션 모드로 실행 중');
  }
  
  // 4. 설정 변경 감지
  const manager = getGlobalConfig();
  manager.watch((newConfig) => {
    console.log('설정이 변경되었습니다:', newConfig.name);
  });
}

// ===== 모듈 정보 =====

export const CONFIG_MODULE_INFO = {
  name: '@company/config',
  version: '1.0.0',
  description: 'Enterprise Configuration Management Module',
  author: 'Enterprise AI Team',
  license: 'MIT'
} as const;