import { Result } from '@repo/core';
import { StorageProvider } from '../types';
export interface SyncConfig {
    interval?: number;
    strategy?: 'merge' | 'source-wins' | 'target-wins' | 'newest-wins';
    batchSize?: number;
    conflictResolver?: (sourceValue: any, targetValue: any, key: string) => any;
}
export interface SyncResult {
    synced: number;
    conflicts: number;
    errors: string[];
    duration: number;
}
export interface SyncState {
    lastSync: Date;
    inProgress: boolean;
    totalSynced: number;
    totalConflicts: number;
}
export declare class StorageSync {
    private config;
    private syncInterval;
    private state;
    constructor(config?: SyncConfig);
    /**
     * 단방향 동기화 (source → target)
     */
    syncOneWay(source: StorageProvider, target: StorageProvider, filter?: (key: string, value: any) => boolean): Promise<Result<SyncResult>>;
    /**
     * 양방향 동기화
     */
    syncBidirectional(providerA: StorageProvider, providerB: StorageProvider): Promise<Result<SyncResult>>;
    /**
     * 단일 항목 동기화
     */
    private synchronizeItem;
    /**
     * 충돌 해결
     */
    private resolveConflict;
    /**
     * 기본 충돌 해결자
     */
    private defaultConflictResolver;
    /**
     * 값 비교
     */
    private areEqual;
    /**
     * 자동 동기화 시작
     */
    startAutoSync(source: StorageProvider, target: StorageProvider, bidirectional?: boolean): void;
    /**
     * 자동 동기화 중지
     */
    stopAutoSync(): void;
    /**
     * 동기화 상태 조회
     */
    getSyncState(): SyncState;
    /**
     * 선택적 동기화
     */
    syncSelective(source: StorageProvider, target: StorageProvider, keys: string[]): Promise<Result<SyncResult>>;
    /**
     * 증분 동기화 (변경된 항목만)
     */
    syncIncremental(source: StorageProvider, target: StorageProvider, since: Date): Promise<Result<SyncResult>>;
    /**
     * 동기화 검증
     */
    verifySyncIntegrity(providerA: StorageProvider, providerB: StorageProvider): Promise<Result<{
        identical: boolean;
        differences: string[];
    }>>;
}
export declare const defaultStorageSync: StorageSync;
//# sourceMappingURL=StorageSync.d.ts.map