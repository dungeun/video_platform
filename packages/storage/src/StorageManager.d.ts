/**
 * @company/storage - 스토리지 매니저
 * 여러 스토리지 프로바이더를 통합 관리
 */
import { ModuleBase, Result } from '@company/core';
import { StorageProvider, StorageType, StorageConfig, StorageOptions, StorageQuery, StorageListener, StorageStats } from './types';
export declare class StorageManager extends ModuleBase {
    private providers;
    private defaultProvider;
    private listeners;
    private cleanupInterval;
    private storageConfig;
    constructor(config?: StorageConfig);
    protected onInitialize(): Promise<Result<void>>;
    protected onDestroy(): Promise<Result<void>>;
    healthCheck(): Promise<Result<boolean>>;
    /**
     * 값 조회
     */
    get<T>(key: string, provider?: StorageType): Promise<Result<T | null>>;
    /**
     * 값 저장
     */
    set<T>(key: string, value: T, options?: StorageOptions & {
        provider?: StorageType;
    }): Promise<Result<void>>;
    /**
     * 값 삭제
     */
    delete(key: string, provider?: StorageType): Promise<Result<void>>;
    /**
     * 키 존재 여부 확인
     */
    exists(key: string, provider?: StorageType): Promise<Result<boolean>>;
    /**
     * 여러 값 조회
     */
    getMany<T>(keys: string[], provider?: StorageType): Promise<Result<Map<string, T>>>;
    /**
     * 여러 값 저장
     */
    setMany<T>(entries: Map<string, T>, options?: StorageOptions & {
        provider?: StorageType;
    }): Promise<Result<void>>;
    /**
     * 여러 값 삭제
     */
    deleteMany(keys: string[], provider?: StorageType): Promise<Result<void>>;
    /**
     * 키 목록 조회
     */
    keys(query?: StorageQuery & {
        provider?: StorageType;
    }): Promise<Result<string[]>>;
    /**
     * 값 목록 조회
     */
    values<T>(query?: StorageQuery & {
        provider?: StorageType;
    }): Promise<Result<T[]>>;
    /**
     * 키-값 쌍 목록 조회
     */
    entries<T>(query?: StorageQuery & {
        provider?: StorageType;
    }): Promise<Result<Array<[string, T]>>>;
    /**
     * 스토리지 초기화
     */
    clear(namespace?: string, provider?: StorageType): Promise<Result<void>>;
    /**
     * 스토리지 크기 조회
     */
    size(namespace?: string, provider?: StorageType): Promise<Result<number>>;
    /**
     * 프로바이더 추가
     */
    addProvider(type: StorageType, provider: StorageProvider): void;
    /**
     * 프로바이더 제거
     */
    removeProvider(type: StorageType): void;
    /**
     * 프로바이더 조회
     */
    getProvider(type?: StorageType): StorageProvider;
    /**
     * 사용 가능한 프로바이더 목록
     */
    getAvailableProviders(): StorageType[];
    /**
     * 기본 프로바이더 설정
     */
    setDefaultProvider(type: StorageType): void;
    /**
     * 이벤트 리스너 추가
     */
    addEventListener(listener: StorageListener): () => void;
    /**
     * 이벤트 리스너 제거
     */
    removeEventListener(listener: StorageListener): void;
    /**
     * 이벤트 발행
     */
    private emitEvent;
    /**
     * 스토리지 통계 조회
     */
    getStats(provider?: StorageType): Promise<StorageStats[]>;
    /**
     * 개별 프로바이더 통계
     */
    private getProviderStats;
    /**
     * 프로바이더 초기화
     */
    private initializeProviders;
    /**
     * 자동 정리 시작
     */
    private startAutoCleanup;
    /**
     * 자동 정리 중지
     */
    private stopAutoCleanup;
    /**
     * 로컬 스토리지 직접 접근
     */
    get local(): StorageProvider;
    /**
     * 세션 스토리지 직접 접근
     */
    get session(): StorageProvider;
    /**
     * 메모리 스토리지 직접 접근
     */
    get memory(): StorageProvider;
}
//# sourceMappingURL=StorageManager.d.ts.map