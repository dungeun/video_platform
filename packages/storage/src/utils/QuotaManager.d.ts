import { Result } from '@company/core';
export interface QuotaInfo {
    usage: number;
    quota: number;
    percentage: number;
    available: number;
}
export interface QuotaConfig {
    maxQuota?: number;
    warningThreshold?: number;
    criticalThreshold?: number;
    autoCleanup?: boolean;
    cleanupStrategy?: 'oldest' | 'largest' | 'lru';
}
export interface QuotaAllocation {
    namespace: string;
    allocated: number;
    used: number;
    lastUpdated: Date;
}
export declare class QuotaManager {
    private config;
    private allocations;
    private quotaListeners;
    constructor(config?: QuotaConfig);
    /**
     * 스토리지 쿼터 조회
     */
    getQuota(): Promise<Result<QuotaInfo>>;
    /**
     * 지속적인 스토리지 요청
     */
    requestPersistentStorage(): Promise<Result<boolean>>;
    /**
     * 지속 스토리지 상태 확인
     */
    isPersisted(): Promise<Result<boolean>>;
    /**
     * 네임스페이스별 쿼터 할당
     */
    allocateQuota(namespace: string, bytes: number): Result<void>;
    /**
     * 네임스페이스별 사용량 업데이트
     */
    updateUsage(namespace: string, bytes: number): Result<void>;
    /**
     * 네임스페이스별 쿼터 정보
     */
    getNamespaceQuota(namespace: string): Result<QuotaInfo>;
    /**
     * 쿼터 초과 시 자동 정리
     */
    performAutoCleanup(provider: any, targetSize: number): Promise<Result<number>>;
    /**
     * 가장 오래된 항목부터 정리
     */
    private cleanupOldest;
    /**
     * 가장 큰 항목부터 정리
     */
    private cleanupLargest;
    /**
     * 가장 적게 사용된 항목부터 정리 (LRU)
     */
    private cleanupLRU;
    /**
     * 쿼터 상태 확인 및 알림
     */
    private checkQuotaStatus;
    /**
     * 쿼터 리스너 등록
     */
    addQuotaListener(listener: (info: QuotaInfo) => void): void;
    /**
     * 쿼터 리스너 제거
     */
    removeQuotaListener(listener: (info: QuotaInfo) => void): void;
    /**
     * 전체 할당량 계산
     */
    private getTotalAllocated;
    /**
     * 전체 사용량 계산
     */
    private getTotalUsage;
    /**
     * 데이터 크기 계산
     */
    private calculateSize;
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
    };
    /**
     * 쿼터 재조정
     */
    rebalanceQuotas(): Result<void>;
}
export declare const defaultQuotaManager: QuotaManager;
//# sourceMappingURL=QuotaManager.d.ts.map