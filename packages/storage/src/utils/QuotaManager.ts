import { Result } from '@repo/core';

export interface QuotaInfo {
  usage: number;
  quota: number;
  percentage: number;
  available: number;
}

export interface QuotaConfig {
  maxQuota?: number; // 최대 할당량 (바이트)
  warningThreshold?: number; // 경고 임계값 (0-1)
  criticalThreshold?: number; // 위험 임계값 (0-1)
  autoCleanup?: boolean; // 자동 정리 활성화
  cleanupStrategy?: 'oldest' | 'largest' | 'lru'; // 정리 전략
}

export interface QuotaAllocation {
  namespace: string;
  allocated: number;
  used: number;
  lastUpdated: Date;
}

export class QuotaManager {
  private config: Required<QuotaConfig>;
  private allocations: Map<string, QuotaAllocation> = new Map();
  private quotaListeners: Array<(info: QuotaInfo) => void> = [];

  constructor(config?: QuotaConfig) {
    this.config = {
      maxQuota: 50 * 1024 * 1024, // 기본 50MB
      warningThreshold: 0.8, // 80%
      criticalThreshold: 0.95, // 95%
      autoCleanup: true,
      cleanupStrategy: 'lru',
      ...config
    };
  }

  /**
   * 스토리지 쿼터 조회
   */
  async getQuota(): Promise<Result<QuotaInfo>> {
    try {
      // navigator.storage.estimate() 사용 가능 여부 확인
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        
        const usage = estimate.usage || 0;
        const quota = estimate.quota || this.config.maxQuota;
        const percentage = quota > 0 ? (usage / quota) * 100 : 0;
        const available = Math.max(0, quota - usage);

        return Result.success({
          usage,
          quota,
          percentage,
          available
        });
      } else {
        // 폴백: 수동 계산
        const totalUsed = this.getTotalUsage();
        const quota = this.config.maxQuota;
        const percentage = (totalUsed / quota) * 100;
        const available = Math.max(0, quota - totalUsed);

        return Result.success({
          usage: totalUsed,
          quota,
          percentage,
          available
        });
      }
    } catch (error) {
      return Result.failure('QUOTA_CHECK_FAILED', `쿼터 조회 실패: ${error}`);
    }
  }

  /**
   * 지속적인 스토리지 요청
   */
  async requestPersistentStorage(): Promise<Result<boolean>> {
    try {
      if ('storage' in navigator && 'persist' in navigator.storage) {
        const isPersisted = await navigator.storage.persist();
        return Result.success(isPersisted);
      }
      return Result.success(false);
    } catch (error) {
      return Result.failure('PERSIST_REQUEST_FAILED', `지속 스토리지 요청 실패: ${error}`);
    }
  }

  /**
   * 지속 스토리지 상태 확인
   */
  async isPersisted(): Promise<Result<boolean>> {
    try {
      if ('storage' in navigator && 'persisted' in navigator.storage) {
        const isPersisted = await navigator.storage.persisted();
        return Result.success(isPersisted);
      }
      return Result.success(false);
    } catch (error) {
      return Result.failure('PERSIST_CHECK_FAILED', `지속 상태 확인 실패: ${error}`);
    }
  }

  /**
   * 네임스페이스별 쿼터 할당
   */
  allocateQuota(namespace: string, bytes: number): Result<void> {
    const totalAllocated = this.getTotalAllocated();
    
    if (totalAllocated + bytes > this.config.maxQuota) {
      return Result.failure('QUOTA_EXCEEDED', '할당 가능한 쿼터 초과');
    }

    this.allocations.set(namespace, {
      namespace,
      allocated: bytes,
      used: 0,
      lastUpdated: new Date()
    });

    return Result.success(undefined);
  }

  /**
   * 네임스페이스별 사용량 업데이트
   */
  updateUsage(namespace: string, bytes: number): Result<void> {
    const allocation = this.allocations.get(namespace);
    
    if (!allocation) {
      // 할당되지 않은 네임스페이스는 기본 할당
      const defaultAllocation = Math.min(10 * 1024 * 1024, this.config.maxQuota / 10); // 10MB 또는 전체의 10%
      this.allocations.set(namespace, {
        namespace,
        allocated: defaultAllocation,
        used: bytes,
        lastUpdated: new Date()
      });
    } else {
      allocation.used = bytes;
      allocation.lastUpdated = new Date();
    }

    // 쿼터 확인 및 알림
    this.checkQuotaStatus();

    return Result.success(undefined);
  }

  /**
   * 네임스페이스별 쿼터 정보
   */
  getNamespaceQuota(namespace: string): Result<QuotaInfo> {
    const allocation = this.allocations.get(namespace);
    
    if (!allocation) {
      return Result.failure('NAMESPACE_NOT_FOUND', '네임스페이스를 찾을 수 없습니다');
    }

    const percentage = allocation.allocated > 0 
      ? (allocation.used / allocation.allocated) * 100 
      : 0;

    return Result.success({
      usage: allocation.used,
      quota: allocation.allocated,
      percentage,
      available: Math.max(0, allocation.allocated - allocation.used)
    });
  }

  /**
   * 쿼터 초과 시 자동 정리
   */
  async performAutoCleanup(provider: any, targetSize: number): Promise<Result<number>> {
    if (!this.config.autoCleanup) {
      return Result.failure('AUTO_CLEANUP_DISABLED', '자동 정리가 비활성화되어 있습니다');
    }

    try {
      let cleaned = 0;
      const currentQuota = await this.getQuota();
      
      if (currentQuota.isFailure) {
        return Result.failure('CLEANUP_QUOTA_CHECK_FAILED', '쿼터 확인 실패');
      }

      const targetUsage = currentQuota.data.quota * 0.7; // 70%로 정리
      const toClean = currentQuota.data.usage - targetUsage;

      if (toClean <= 0) {
        return Result.success(0);
      }

      switch (this.config.cleanupStrategy) {
        case 'oldest':
          cleaned = await this.cleanupOldest(provider, toClean);
          break;
        case 'largest':
          cleaned = await this.cleanupLargest(provider, toClean);
          break;
        case 'lru':
          cleaned = await this.cleanupLRU(provider, toClean);
          break;
      }

      return Result.success(cleaned);
    } catch (error) {
      return Result.failure('AUTO_CLEANUP_FAILED', `자동 정리 실패: ${error}`);
    }
  }

  /**
   * 가장 오래된 항목부터 정리
   */
  private async cleanupOldest(provider: any, targetBytes: number): Promise<number> {
    const entriesResult = await provider.entries();
    if (entriesResult.isFailure) return 0;

    const entries = entriesResult.data
      .map(([key, value]: [string, any]) => ({
        key,
        size: this.calculateSize(value),
        created: value.metadata?.created || 0
      }))
      .sort((a: any, b: any) => a.created - b.created);

    let cleaned = 0;
    let cleanedBytes = 0;

    for (const entry of entries) {
      if (cleanedBytes >= targetBytes) break;
      
      const deleteResult = await provider.delete(entry.key);
      if (deleteResult.isSuccess) {
        cleaned++;
        cleanedBytes += entry.size;
      }
    }

    return cleaned;
  }

  /**
   * 가장 큰 항목부터 정리
   */
  private async cleanupLargest(provider: any, targetBytes: number): Promise<number> {
    const entriesResult = await provider.entries();
    if (entriesResult.isFailure) return 0;

    const entries = entriesResult.data
      .map(([key, value]: [string, any]) => ({
        key,
        size: this.calculateSize(value)
      }))
      .sort((a: any, b: any) => b.size - a.size);

    let cleaned = 0;
    let cleanedBytes = 0;

    for (const entry of entries) {
      if (cleanedBytes >= targetBytes) break;
      
      const deleteResult = await provider.delete(entry.key);
      if (deleteResult.isSuccess) {
        cleaned++;
        cleanedBytes += entry.size;
      }
    }

    return cleaned;
  }

  /**
   * 가장 적게 사용된 항목부터 정리 (LRU)
   */
  private async cleanupLRU(provider: any, targetBytes: number): Promise<number> {
    const entriesResult = await provider.entries();
    if (entriesResult.isFailure) return 0;

    const entries = entriesResult.data
      .map(([key, value]: [string, any]) => ({
        key,
        size: this.calculateSize(value),
        accessed: value.metadata?.accessed || 0
      }))
      .sort((a: any, b: any) => a.accessed - b.accessed);

    let cleaned = 0;
    let cleanedBytes = 0;

    for (const entry of entries) {
      if (cleanedBytes >= targetBytes) break;
      
      const deleteResult = await provider.delete(entry.key);
      if (deleteResult.isSuccess) {
        cleaned++;
        cleanedBytes += entry.size;
      }
    }

    return cleaned;
  }

  /**
   * 쿼터 상태 확인 및 알림
   */
  private async checkQuotaStatus(): Promise<void> {
    const quotaResult = await this.getQuota();
    if (quotaResult.isFailure) return;

    const quota = quotaResult.data;
    const percentage = quota.percentage / 100;

    // 리스너에게 알림
    this.quotaListeners.forEach(listener => listener(quota));

    // 임계값 확인
    if (percentage >= this.config.criticalThreshold) {
      console.error('스토리지 쿼터 위험:', `${quota.percentage.toFixed(1)}% 사용 중`);
    } else if (percentage >= this.config.warningThreshold) {
      console.warn('스토리지 쿼터 경고:', `${quota.percentage.toFixed(1)}% 사용 중`);
    }
  }

  /**
   * 쿼터 리스너 등록
   */
  addQuotaListener(listener: (info: QuotaInfo) => void): void {
    this.quotaListeners.push(listener);
  }

  /**
   * 쿼터 리스너 제거
   */
  removeQuotaListener(listener: (info: QuotaInfo) => void): void {
    const index = this.quotaListeners.indexOf(listener);
    if (index > -1) {
      this.quotaListeners.splice(index, 1);
    }
  }

  /**
   * 전체 할당량 계산
   */
  private getTotalAllocated(): number {
    let total = 0;
    for (const allocation of this.allocations.values()) {
      total += allocation.allocated;
    }
    return total;
  }

  /**
   * 전체 사용량 계산
   */
  private getTotalUsage(): number {
    let total = 0;
    for (const allocation of this.allocations.values()) {
      total += allocation.used;
    }
    return total;
  }

  /**
   * 데이터 크기 계산
   */
  private calculateSize(value: any): number {
    const str = JSON.stringify(value);
    return new Blob([str]).size;
  }

  /**
   * 쿼터 통계
   */
  getQuotaStats(): {
    totalAllocated: number;
    totalUsed: number;
    namespaces: Array<{
      namespace: string;
      allocated: number;
      used: number;
      percentage: number;
    }>;
  } {
    const namespaces = Array.from(this.allocations.values()).map(allocation => ({
      namespace: allocation.namespace,
      allocated: allocation.allocated,
      used: allocation.used,
      percentage: allocation.allocated > 0 
        ? (allocation.used / allocation.allocated) * 100 
        : 0
    }));

    return {
      totalAllocated: this.getTotalAllocated(),
      totalUsed: this.getTotalUsage(),
      namespaces
    };
  }

  /**
   * 쿼터 재조정
   */
  rebalanceQuotas(): Result<void> {
    const totalUsed = this.getTotalUsage();
    const activeNamespaces = this.allocations.size;
    
    if (activeNamespaces === 0) {
      return Result.success(undefined);
    }

    // 균등 분배 전략
    const equalShare = Math.floor(this.config.maxQuota / activeNamespaces);
    
    for (const allocation of this.allocations.values()) {
      // 사용량보다 작게 할당하지 않음
      allocation.allocated = Math.max(allocation.used * 1.2, equalShare);
      allocation.lastUpdated = new Date();
    }

    return Result.success(undefined);
  }
}

export const defaultQuotaManager = new QuotaManager();