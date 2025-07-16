/**
 * @company/storage - LocalStorage 프로바이더
 * 브라우저 LocalStorage 기반 스토리지
 */
import { Logger, Result } from '@company/core';
import { StorageProvider, StorageType, StorageOptions, StorageQuery, LocalStorageConfig, StorageSerializer as IStorageSerializer } from '../types';
export declare class LocalStorageProvider implements StorageProvider {
    readonly name: string;
    readonly type: StorageType;
    protected logger: Logger;
    protected config: Required<LocalStorageConfig>;
    protected serializer: IStorageSerializer;
    constructor(config?: LocalStorageConfig);
    /**
     * LocalStorage 사용 가능 여부
     */
    get isAvailable(): boolean;
    /**
     * 용량 제한 (대략적인 추정)
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
     * 전체 키 생성
     */
    protected getFullKey(key: string, namespace?: string): string;
    /**
     * 만료된 항목 정리
     */
    cleanup(): Promise<number>;
}
//# sourceMappingURL=LocalStorageProvider.d.ts.map