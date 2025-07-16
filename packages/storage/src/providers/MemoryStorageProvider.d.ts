/**
 * @repo/storage - Memory 스토리지 프로바이더
 * 메모리 기반 임시 스토리지
 */
import { Result } from '@repo/core';
import { StorageProvider, StorageType, StorageOptions, StorageQuery, MemoryStorageConfig } from '../types';
export declare class MemoryStorageProvider implements StorageProvider {
    readonly name = "MemoryStorage";
    readonly type = StorageType.MEMORY;
    private logger;
    private config;
    private storage;
    private namespaces;
    constructor(config?: MemoryStorageConfig);
    /**
     * 메모리 스토리지는 항상 사용 가능
     */
    get isAvailable(): boolean;
    /**
     * 설정된 최대 용량
     */
    get capacity(): number;
    /**
     * 값 조회
     */
    get<T>(key: string): Promise<Result<T | null>>;
    /**
     * 값 저장
     */
    set<T>(key: string, value: T, options?: StorageOptions): Promise<Result<void>>;
    /**
     * 값 삭제
     */
    delete(key: string): Promise<Result<void>>;
    /**
     * 키 존재 여부 확인
     */
    exists(key: string): Promise<Result<boolean>>;
    /**
     * 여러 값 조회
     */
    getMany<T>(keys: string[]): Promise<Result<Map<string, T>>>;
    /**
     * 여러 값 저장
     */
    setMany<T>(entries: Map<string, T>, options?: StorageOptions): Promise<Result<void>>;
    /**
     * 여러 값 삭제
     */
    deleteMany(keys: string[]): Promise<Result<void>>;
    /**
     * 키 목록 조회
     */
    keys(query?: StorageQuery): Promise<Result<string[]>>;
    /**
     * 값 목록 조회
     */
    values<T>(query?: StorageQuery): Promise<Result<T[]>>;
    /**
     * 키-값 쌍 목록 조회
     */
    entries<T>(query?: StorageQuery): Promise<Result<Array<[string, T]>>>;
    /**
     * 스토리지 초기화
     */
    clear(namespace?: string): Promise<Result<void>>;
    /**
     * 스토리지 크기 조회
     */
    size(namespace?: string): Promise<Result<number>>;
    /**
     * 현재 전체 크기 계산
     */
    private getCurrentSize;
    /**
     * 객체 크기 추정
     */
    private estimateSize;
    /**
     * 공간 확보를 위한 항목 제거
     */
    private evictEntries;
    /**
     * 만료된 항목 정리
     */
    cleanup(): Promise<number>;
    /**
     * 스토리지 통계
     */
    getStats(): {
        itemCount: number;
        namespaceCount: number;
        totalSize: number;
        averageAccessCount: number;
        oldestItem: Date | null;
        newestItem: Date | null;
    };
}
//# sourceMappingURL=MemoryStorageProvider.d.ts.map