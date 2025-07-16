/**
 * @repo/api-client - 캐시 관리자
 * HTTP 응답 캐싱 관리
 */
import { CacheConfig, CacheEntry, CacheStorage, HttpRequestConfig, HttpResponse } from '../types';
export declare class CacheManager {
    private logger;
    private storage;
    private config;
    private defaultTTL;
    constructor(config?: CacheConfig);
    /**
     * 캐시 초기화
     */
    initialize(): Promise<void>;
    /**
     * 캐시에서 응답 조회
     */
    get(config: HttpRequestConfig): Promise<HttpResponse | null>;
    /**
     * 캐시에 응답 저장
     */
    set(config: HttpRequestConfig, response: HttpResponse): Promise<void>;
    /**
     * 캐시 제거
     */
    delete(config: HttpRequestConfig): Promise<void>;
    /**
     * 전체 캐시 제거
     */
    clear(): Promise<void>;
    /**
     * 캐시 키 생성
     */
    private generateCacheKey;
    /**
     * 캐시 통계 조회
     */
    getStats(): Promise<{
        size: number;
        hits: number;
        misses: number;
        hitRate: number;
    }>;
    /**
     * 패턴으로 캐시 제거
     */
    deleteByPattern(pattern: string | RegExp): Promise<number>;
    /**
     * 캐시 갱신
     */
    refresh(config: HttpRequestConfig): Promise<void>;
}
/**
 * 메모리 기반 캐시 스토리지
 */
export declare class MemoryCacheStorage implements CacheStorage {
    private cache;
    private logger;
    constructor();
    get(key: string): Promise<CacheEntry | null>;
    set(key: string, value: CacheEntry): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
    /**
     * 만료된 항목 정리
     */
    cleanup(): void;
    /**
     * 캐시 크기 조회
     */
    size(): number;
}
//# sourceMappingURL=CacheManager.d.ts.map