/**
 * @repo/api-client - 캐시 관리자
 * HTTP 응답 캐싱 관리
 */
import { Logger } from '@repo/core';
export class CacheManager {
    constructor(config) {
        this.defaultTTL = 5 * 60 * 1000; // 5분
        this.logger = new Logger('CacheManager');
        this.config = config || { enabled: false };
        this.storage = config?.storage || new MemoryCacheStorage();
    }
    /**
     * 캐시 초기화
     */
    async initialize() {
        if (this.config.enabled) {
            await this.storage.clear();
            this.logger.info('캐시 매니저 초기화 완료');
        }
    }
    /**
     * 캐시에서 응답 조회
     */
    async get(config) {
        if (!this.config.enabled) {
            return null;
        }
        const key = this.generateCacheKey(config);
        const entry = await this.storage.get(key);
        if (!entry) {
            return null;
        }
        // TTL 확인
        const now = Date.now();
        if (now > entry.timestamp + entry.ttl) {
            await this.storage.delete(key);
            this.logger.debug('캐시 만료', { key });
            return null;
        }
        this.logger.debug('캐시 히트', { key });
        return entry.data;
    }
    /**
     * 캐시에 응답 저장
     */
    async set(config, response) {
        if (!this.config.enabled) {
            return;
        }
        // 캐시 가능 여부 확인
        if (this.config.shouldCache && !this.config.shouldCache(response)) {
            return;
        }
        const key = this.generateCacheKey(config);
        const ttl = this.config.ttl || this.defaultTTL;
        const entry = {
            data: response,
            timestamp: Date.now(),
            ttl
        };
        await this.storage.set(key, entry);
        this.logger.debug('캐시 저장', { key, ttl });
    }
    /**
     * 캐시 제거
     */
    async delete(config) {
        if (!this.config.enabled) {
            return;
        }
        const key = this.generateCacheKey(config);
        await this.storage.delete(key);
        this.logger.debug('캐시 제거', { key });
    }
    /**
     * 전체 캐시 제거
     */
    async clear() {
        await this.storage.clear();
        this.logger.info('전체 캐시 제거 완료');
    }
    /**
     * 캐시 키 생성
     */
    generateCacheKey(config) {
        if (this.config.key) {
            if (typeof this.config.key === 'function') {
                return this.config.key(config);
            }
            return this.config.key;
        }
        // 기본 키 생성: method + url + params
        const parts = [
            config.method || 'GET',
            config.url || '',
            JSON.stringify(config.params || {})
        ];
        return parts.join(':');
    }
    /**
     * 캐시 통계 조회
     */
    async getStats() {
        // 실제 구현에서는 storage에서 통계를 관리
        return {
            size: 0,
            hits: 0,
            misses: 0,
            hitRate: 0
        };
    }
    /**
     * 패턴으로 캐시 제거
     */
    async deleteByPattern(pattern) {
        // 실제 구현에서는 storage에서 패턴 매칭 지원
        this.logger.info('패턴으로 캐시 제거', { pattern: pattern.toString() });
        return 0;
    }
    /**
     * 캐시 갱신
     */
    async refresh(config) {
        await this.delete(config);
        this.logger.debug('캐시 갱신 요청', { url: config.url });
    }
}
/**
 * 메모리 기반 캐시 스토리지
 */
export class MemoryCacheStorage {
    constructor() {
        this.cache = new Map();
        this.logger = new Logger('MemoryCacheStorage');
    }
    async get(key) {
        return this.cache.get(key) || null;
    }
    async set(key, value) {
        this.cache.set(key, value);
        // 메모리 관리를 위한 크기 제한
        if (this.cache.size > 1000) {
            // 가장 오래된 항목 제거 (LRU)
            const firstKey = this.cache.keys().next().value;
            if (firstKey) {
                this.cache.delete(firstKey);
            }
        }
    }
    async delete(key) {
        this.cache.delete(key);
    }
    async clear() {
        this.cache.clear();
    }
    /**
     * 만료된 항목 정리
     */
    cleanup() {
        const now = Date.now();
        const expiredKeys = [];
        this.cache.forEach((entry, key) => {
            if (now > entry.timestamp + entry.ttl) {
                expiredKeys.push(key);
            }
        });
        expiredKeys.forEach(key => this.cache.delete(key));
        if (expiredKeys.length > 0) {
            this.logger.debug('만료된 캐시 정리', { count: expiredKeys.length });
        }
    }
    /**
     * 캐시 크기 조회
     */
    size() {
        return this.cache.size;
    }
}
//# sourceMappingURL=CacheManager.js.map