import { Result } from './types';
import { createHash } from 'crypto';
import {
  AppConfig,
  ConfigManager as IConfigManager,
  ConfigSource,
  ConfigMetadata,
  ConfigChangeEvent,
  ConfigEventListener,
  ConfigOptions,
  DEFAULT_CONFIG_SOURCES
} from './types';
import { ConfigValidator } from './validators/ConfigValidator';
import { EnvConfigLoader } from './loaders/EnvConfigLoader';
import { FileConfigLoader } from './loaders/FileConfigLoader';
import { ConfigLoader } from './types';

/**
 * 설정 관리자 - 다양한 소스에서 설정을 로드하고 관리
 */
export class ConfigManager implements IConfigManager {
  private config: AppConfig | null = null;
  private metadata: ConfigMetadata | null = null;
  private loaders: Map<string, ConfigLoader> = new Map();
  private validator: ConfigValidator;
  private listeners: ConfigEventListener[] = [];
  private options: Required<ConfigOptions>;
  
  constructor(options: ConfigOptions = {}) {
    this.options = {
      sources: DEFAULT_CONFIG_SOURCES,
      hotReload: true,
      validateOnLoad: true,
      throwOnValidationError: true,
      defaultEnvironment: 'development',
      ...options
    };
    
    this.validator = new ConfigValidator();
    this.initializeLoaders();
  }
  
  /**
   * 로더 초기화
   */
  private initializeLoaders(): void {
    // 환경변수 로더
    this.loaders.set('env', new EnvConfigLoader());
    
    // 파일 로더들
    this.options.sources
      .filter(source => source.type === 'file' && source.path)
      .forEach(source => {
        const key = `file:${source.path}`;
        this.loaders.set(key, new FileConfigLoader(source.path!));
      });
  }
  
  /**
   * 설정 로드
   */
  async load(): Promise<Result<AppConfig>> {
    try {
      const mergedConfig = await this.loadFromAllSources();
      
      // 검증
      if (this.options.validateOnLoad) {
        const validationResult = this.validator.validate(mergedConfig);
        if (validationResult.isFailure) {
          const error = new Error(`설정 검증 실패: ${validationResult.message}`);
          this.emitEvent({ type: 'error', error, timestamp: new Date() });
          
          if (this.options.throwOnValidationError) {
            return Result.failure('CONFIG_VALIDATION_FAILED', validationResult.message || 'Validation failed');
          }
        } else {
          this.config = validationResult.data;
        }
      } else {
        this.config = mergedConfig as AppConfig;
      }
      
      // 메타데이터 생성
      this.metadata = {
        version: '1.0.0',
        environment: this.config.environment,
        loadedAt: new Date(),
        sources: this.options.sources,
        hash: this.generateConfigHash(this.config)
      };
      
      // Hot reload 설정
      if (this.options.hotReload) {
        this.setupHotReload();
      }
      
      this.emitEvent({ 
        type: 'loaded', 
        config: this.config, 
        timestamp: new Date() 
      });
      
      return Result.success(this.config);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.emitEvent({ type: 'error', error: error as Error, timestamp: new Date() });
      return Result.failure('CONFIG_LOAD_FAILED', `설정 로드 실패: ${errorMsg}`);
    }
  }
  
  /**
   * 모든 소스에서 설정 로드 및 병합
   */
  private async loadFromAllSources(): Promise<Partial<AppConfig>> {
    const configParts: Array<{ config: Partial<AppConfig>; priority: number }> = [];
    
    // 모든 로더에서 데이터 로드
    for (const [key, loader] of this.loaders.entries()) {
      try {
        const result = await loader.load();
        if (result.isSuccess && result.data) {
          const source = this.getSourceByLoaderKey(key);
          configParts.push({
            config: result.data,
            priority: source?.priority || 0
          });
        }
      } catch (error) {
        console.warn(`로더 ${key}에서 오류:`, error);
      }
    }
    
    // 우선순위에 따라 정렬 (높은 우선순위가 나중에 적용)
    configParts.sort((a, b) => a.priority - b.priority);
    
    // 설정 병합
    let mergedConfig: Partial<AppConfig> = {};
    for (const part of configParts) {
      mergedConfig = this.deepMerge(mergedConfig, part.config);
    }
    
    return mergedConfig;
  }
  
  /**
   * 설정 값 조회
   */
  get<K extends keyof AppConfig>(key: K): AppConfig[K] | undefined {
    return this.config?.[key];
  }
  
  /**
   * 전체 설정 조회
   */
  getAll(): AppConfig {
    if (!this.config) {
      throw new Error('설정이 로드되지 않았습니다. load()를 먼저 호출하세요.');
    }
    return this.config;
  }
  
  /**
   * 설정 재로드
   */
  async reload(): Promise<Result<AppConfig>> {
    const result = await this.load();
    if (result.isSuccess) {
      this.emitEvent({
        type: 'reloaded',
        config: result.data,
        timestamp: new Date()
      });
    }
    return result;
  }
  
  /**
   * 설정 변경 감지 리스너 등록
   */
  watch(callback: (config: AppConfig) => void): void {
    const listener: ConfigEventListener = (event) => {
      if (event.config && (event.type === 'loaded' || event.type === 'reloaded')) {
        callback(event.config);
      }
    };
    this.listeners.push(listener);
  }
  
  /**
   * 메타데이터 조회
   */
  getMetadata(): ConfigMetadata {
    if (!this.metadata) {
      throw new Error('설정이 로드되지 않았습니다.');
    }
    return this.metadata;
  }
  
  /**
   * Hot reload 설정
   */
  private setupHotReload(): void {
    for (const [key, loader] of this.loaders.entries()) {
      if (loader.watch) {
        loader.watch(async (partialConfig) => {
          try {
            const newMergedConfig = await this.loadFromAllSources();
            const validationResult = this.validator.validate(newMergedConfig);
            
            if (validationResult.isSuccess) {
              const oldHash = this.metadata?.hash;
              const newHash = this.generateConfigHash(validationResult.data);
              
              if (oldHash !== newHash) {
                this.config = validationResult.data;
                this.metadata = {
                  ...this.metadata!,
                  loadedAt: new Date(),
                  hash: newHash
                };
                
                this.emitEvent({
                  type: 'reloaded',
                  config: this.config,
                  timestamp: new Date()
                });
              }
            }
          } catch (error) {
            this.emitEvent({
              type: 'error',
              error: error as Error,
              timestamp: new Date()
            });
          }
        });
      }
    }
  }
  
  /**
   * 이벤트 발생
   */
  private emitEvent(event: ConfigChangeEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('설정 이벤트 리스너 오류:', error);
      }
    });
  }
  
  /**
   * 설정 해시 생성
   */
  private generateConfigHash(config: AppConfig): string {
    const configString = JSON.stringify(config, null, 0);
    return createHash('md5').update(configString).digest('hex');
  }
  
  /**
   * 로더 키로 소스 찾기
   */
  private getSourceByLoaderKey(key: string): ConfigSource | undefined {
    if (key === 'env') {
      return this.options.sources.find(s => s.type === 'env');
    }
    if (key.startsWith('file:')) {
      const path = key.replace('file:', '');
      return this.options.sources.find(s => s.type === 'file' && s.path === path);
    }
    return undefined;
  }
  
  /**
   * 객체 깊은 병합
   */
  private deepMerge<T>(target: T, source: Partial<T>): T {
    const result = { ...target };
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        const sourceValue = source[key];
        const targetValue = result[key];
        
        if (this.isObject(sourceValue) && this.isObject(targetValue)) {
          result[key] = this.deepMerge(targetValue, sourceValue) as any;
        } else {
          result[key] = sourceValue as any;
        }
      }
    }
    
    return result;
  }
  
  /**
   * 객체 여부 확인
   */
  private isObject(item: unknown): item is Record<string, unknown> {
    return item !== null && typeof item === 'object' && !Array.isArray(item);
  }
  
  /**
   * 리소스 정리
   */
  dispose(): void {
    this.listeners = [];
    this.loaders.clear();
    this.config = null;
    this.metadata = null;
  }
}