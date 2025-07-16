/**
 * @repo/storage - 스토리지 매니저
 * 여러 스토리지 프로바이더를 통합 관리
 */

import { ModuleBase, Result, Logger } from '@repo/core';
import { 
  StorageProvider,
  StorageType,
  StorageConfig,
  StorageOptions,
  StorageQuery,
  StorageEvent,
  StorageEventType,
  StorageListener,
  StorageStats
} from './types';
import { LocalStorageProvider } from './providers/LocalStorageProvider';
import { SessionStorageProvider } from './providers/SessionStorageProvider';
import { MemoryStorageProvider } from './providers/MemoryStorageProvider';

export class StorageManager extends ModuleBase {
  private providers: Map<StorageType, StorageProvider> = new Map();
  private defaultProvider: StorageType;
  private listeners: Set<StorageListener> = new Set();
  private cleanupInterval: NodeJS.Timeout | undefined;
  private storageConfig: StorageConfig;

  constructor(config?: StorageConfig) {
    super({
      name: '@repo/storage',
      version: '1.0.0',
      description: 'Enterprise Storage Manager'
    });

    this.storageConfig = {
      defaultProvider: StorageType.LOCAL,
      autoCleanup: true,
      cleanupInterval: 60000, // 1분
      ...config
    };

    this.defaultProvider = this.storageConfig.defaultProvider!;
    this.initializeProviders();
  }

  // ===== 라이프사이클 메소드 =====

  protected async onInitialize(): Promise<Result<void>> {
    try {
      // 각 프로바이더 초기화
      for (const [type, provider] of this.providers) {
        if (provider.initialize) {
          const result = await provider.initialize();
          if (!result.success) {
            this.logger.warn(`프로바이더 초기화 실패: ${type}`, result.error);
          }
        }
      }

      // 자동 정리 설정
      if (this.storageConfig.autoCleanup) {
        this.startAutoCleanup();
      }

      this.logger.info('스토리지 매니저 초기화 완료');
      return { success: true };

    } catch (error) {
      const storageError = this.errorHandler.handle(error, '스토리지 매니저 초기화 실패');
      return { success: false, error: storageError };
    }
  }

  protected async onDestroy(): Promise<Result<void>> {
    try {
      // 자동 정리 중지
      this.stopAutoCleanup();

      // 각 프로바이더 종료
      for (const [type, provider] of this.providers) {
        if (provider.destroy) {
          await provider.destroy();
        }
      }

      this.providers.clear();
      this.listeners.clear();

      return { success: true };

    } catch (error) {
      const storageError = this.errorHandler.handle(error, '스토리지 매니저 종료 실패');
      return { success: false, error: storageError };
    }
  }

  public async healthCheck(): Promise<Result<boolean>> {
    try {
      // 기본 프로바이더가 사용 가능한지 확인
      const provider = this.getProvider(this.defaultProvider);
      return { success: true, data: provider.isAvailable };
    } catch {
      return { success: true, data: false };
    }
  }

  // ===== 기본 작업 =====

  /**
   * 값 조회
   */
  public async get<T>(key: string, provider?: StorageType): Promise<Result<T | null>> {
    const storageProvider = this.getProvider(provider);
    const result = await storageProvider.get<T>(key);
    
    return result;
  }

  /**
   * 값 저장
   */
  public async set<T>(
    key: string, 
    value: T, 
    options?: StorageOptions & { provider?: StorageType }
  ): Promise<Result<void>> {
    const provider = options?.provider;
    const storageProvider = this.getProvider(provider);
    
    // 이전 값 조회 (이벤트용)
    const oldValueResult = await storageProvider.get<T>(key);
    const oldValue = oldValueResult.success && oldValueResult.data !== null ? oldValueResult.data : undefined;
    
    const result = await storageProvider.set(key, value, options);
    
    if (result.success) {
      const event: StorageEvent<T> = {
        type: StorageEventType.SET,
        key,
        newValue: value,
        timestamp: Date.now()
      };
      if (oldValue !== undefined) {
        event.oldValue = oldValue;
      }
      if (options?.namespace !== undefined) {
        event.namespace = options.namespace;
      }
      this.emitEvent(event);
    }
    
    return result;
  }

  /**
   * 값 삭제
   */
  public async delete(key: string, provider?: StorageType): Promise<Result<void>> {
    const storageProvider = this.getProvider(provider);
    
    // 삭제 전 값 조회 (이벤트용)
    const oldValueResult = await storageProvider.get(key);
    const oldValue = oldValueResult.success ? oldValueResult.data : undefined;
    
    const result = await storageProvider.delete(key);
    
    if (result.success) {
      this.emitEvent({
        type: StorageEventType.DELETE,
        key,
        oldValue,
        timestamp: Date.now()
      });
    }
    
    return result;
  }

  /**
   * 키 존재 여부 확인
   */
  public async exists(key: string, provider?: StorageType): Promise<Result<boolean>> {
    const storageProvider = this.getProvider(provider);
    return storageProvider.exists(key);
  }

  // ===== 배치 작업 =====

  /**
   * 여러 값 조회
   */
  public async getMany<T>(keys: string[], provider?: StorageType): Promise<Result<Map<string, T>>> {
    const storageProvider = this.getProvider(provider);
    return storageProvider.getMany<T>(keys);
  }

  /**
   * 여러 값 저장
   */
  public async setMany<T>(
    entries: Map<string, T>, 
    options?: StorageOptions & { provider?: StorageType }
  ): Promise<Result<void>> {
    const provider = options?.provider;
    const storageProvider = this.getProvider(provider);
    return storageProvider.setMany(entries, options);
  }

  /**
   * 여러 값 삭제
   */
  public async deleteMany(keys: string[], provider?: StorageType): Promise<Result<void>> {
    const storageProvider = this.getProvider(provider);
    return storageProvider.deleteMany(keys);
  }

  // ===== 쿼리 작업 =====

  /**
   * 키 목록 조회
   */
  public async keys(query?: StorageQuery & { provider?: StorageType }): Promise<Result<string[]>> {
    const provider = query?.provider;
    const storageProvider = this.getProvider(provider);
    return storageProvider.keys(query);
  }

  /**
   * 값 목록 조회
   */
  public async values<T>(query?: StorageQuery & { provider?: StorageType }): Promise<Result<T[]>> {
    const provider = query?.provider;
    const storageProvider = this.getProvider(provider);
    return storageProvider.values<T>(query);
  }

  /**
   * 키-값 쌍 목록 조회
   */
  public async entries<T>(
    query?: StorageQuery & { provider?: StorageType }
  ): Promise<Result<Array<[string, T]>>> {
    const provider = query?.provider;
    const storageProvider = this.getProvider(provider);
    return storageProvider.entries<T>(query);
  }

  // ===== 유틸리티 =====

  /**
   * 스토리지 초기화
   */
  public async clear(namespace?: string, provider?: StorageType): Promise<Result<void>> {
    if (provider) {
      const storageProvider = this.getProvider(provider);
      const result = await storageProvider.clear(namespace);
      
      if (result.success) {
        const event: StorageEvent = {
          type: StorageEventType.CLEAR,
          key: '',
          timestamp: Date.now()
        };
        if (namespace !== undefined) {
          event.namespace = namespace;
        }
        this.emitEvent(event);
      }
      
      return result;
    }

    // 모든 프로바이더 초기화
    for (const storageProvider of this.providers.values()) {
      const result = await storageProvider.clear(namespace);
      if (!result.success) {
        return result;
      }
    }

    const event: StorageEvent = {
      type: StorageEventType.CLEAR,
      key: '',
      timestamp: Date.now()
    };
    if (namespace !== undefined) {
      event.namespace = namespace;
    }
    this.emitEvent(event);

    return { success: true };
  }

  /**
   * 스토리지 크기 조회
   */
  public async size(namespace?: string, provider?: StorageType): Promise<Result<number>> {
    if (provider) {
      const storageProvider = this.getProvider(provider);
      return storageProvider.size(namespace);
    }

    // 모든 프로바이더의 크기 합계
    let totalSize = 0;
    
    for (const storageProvider of this.providers.values()) {
      const result = await storageProvider.size(namespace);
      if (result.success && result.data) {
        totalSize += result.data;
      }
    }

    return { success: true, data: totalSize };
  }

  // ===== 프로바이더 관리 =====

  /**
   * 프로바이더 추가
   */
  public addProvider(type: StorageType, provider: StorageProvider): void {
    this.providers.set(type, provider);
    this.logger.info('프로바이더 추가', { type, name: provider.name });
  }

  /**
   * 프로바이더 제거
   */
  public removeProvider(type: StorageType): void {
    this.providers.delete(type);
    this.logger.info('프로바이더 제거', { type });
  }

  /**
   * 프로바이더 조회
   */
  public getProvider(type?: StorageType): StorageProvider {
    const targetType = type || this.defaultProvider;
    const provider = this.providers.get(targetType);
    
    if (!provider) {
      throw new Error(`프로바이더를 찾을 수 없습니다: ${targetType}`);
    }
    
    if (!provider.isAvailable) {
      throw new Error(`프로바이더를 사용할 수 없습니다: ${targetType}`);
    }
    
    return provider;
  }

  /**
   * 사용 가능한 프로바이더 목록
   */
  public getAvailableProviders(): StorageType[] {
    return Array.from(this.providers.entries())
      .filter(([_, provider]) => provider.isAvailable)
      .map(([type, _]) => type);
  }

  /**
   * 기본 프로바이더 설정
   */
  public setDefaultProvider(type: StorageType): void {
    if (!this.providers.has(type)) {
      throw new Error(`프로바이더를 찾을 수 없습니다: ${type}`);
    }
    
    this.defaultProvider = type;
    this.logger.info('기본 프로바이더 변경', { type });
  }

  // ===== 이벤트 관리 =====

  /**
   * 이벤트 리스너 추가
   */
  public addEventListener(listener: StorageListener): () => void {
    this.listeners.add(listener);
    
    // 제거 함수 반환
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 이벤트 리스너 제거
   */
  public removeEventListener(listener: StorageListener): void {
    this.listeners.delete(listener);
  }

  /**
   * 이벤트 발행
   */
  private emitEvent(event: StorageEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        this.logger.error('이벤트 리스너 실행 중 오류', error);
      }
    }
  }

  // ===== 통계 및 모니터링 =====

  /**
   * 스토리지 통계 조회
   */
  public async getStats(provider?: StorageType): Promise<StorageStats[]> {
    const stats: StorageStats[] = [];
    
    if (provider) {
      const storageProvider = this.getProvider(provider);
      const stat = await this.getProviderStats(provider, storageProvider);
      stats.push(stat);
    } else {
      for (const [type, storageProvider] of this.providers) {
        if (storageProvider.isAvailable) {
          const stat = await this.getProviderStats(type, storageProvider);
          stats.push(stat);
        }
      }
    }
    
    return stats;
  }

  /**
   * 개별 프로바이더 통계
   */
  private async getProviderStats(
    type: StorageType, 
    provider: StorageProvider
  ): Promise<StorageStats> {
    const sizeResult = await provider.size();
    const keysResult = await provider.keys();
    
    const stats: StorageStats = {
      provider: provider.name,
      type,
      totalSize: provider.capacity || 0,
      usedSize: sizeResult.success ? sizeResult.data! : 0,
      availableSize: provider.capacity ? 
        provider.capacity - (sizeResult.success ? sizeResult.data! : 0) : 0,
      itemCount: keysResult.success ? keysResult.data!.length : 0,
      namespaces: [] // 프로바이더별 구현 필요
    };
    
    return stats;
  }

  // ===== 내부 메소드 =====

  /**
   * 프로바이더 초기화
   */
  private initializeProviders(): void {
    // LocalStorage
    this.providers.set(
      StorageType.LOCAL,
      new LocalStorageProvider(this.storageConfig.providers?.local)
    );

    // SessionStorage
    this.providers.set(
      StorageType.SESSION,
      new SessionStorageProvider(this.storageConfig.providers?.session)
    );

    // MemoryStorage
    this.providers.set(
      StorageType.MEMORY,
      new MemoryStorageProvider(this.storageConfig.providers?.memory)
    );
  }

  /**
   * 자동 정리 시작
   */
  private startAutoCleanup(): void {
    this.cleanupInterval = setInterval(async () => {
      for (const [type, provider] of this.providers) {
        if (provider.isAvailable && 'cleanup' in provider) {
          try {
            const cleaned = await (provider as any).cleanup();
            if (cleaned > 0) {
              this.logger.debug('자동 정리 완료', { type, cleaned });
            }
          } catch (error) {
            this.logger.error('자동 정리 중 오류', { type, error });
          }
        }
      }
    }, this.storageConfig.cleanupInterval!);
  }

  /**
   * 자동 정리 중지
   */
  private stopAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }

  // ===== 편의 메소드 =====

  /**
   * 로컬 스토리지 직접 접근
   */
  public get local(): StorageProvider {
    return this.getProvider(StorageType.LOCAL);
  }

  /**
   * 세션 스토리지 직접 접근
   */
  public get session(): StorageProvider {
    return this.getProvider(StorageType.SESSION);
  }

  /**
   * 메모리 스토리지 직접 접근
   */
  public get memory(): StorageProvider {
    return this.getProvider(StorageType.MEMORY);
  }
}