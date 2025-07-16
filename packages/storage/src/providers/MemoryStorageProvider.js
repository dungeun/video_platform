/**
 * @repo/storage - Memory 스토리지 프로바이더
 * 메모리 기반 임시 스토리지
 */
import { Logger } from '@repo/core';
import { StorageType, EvictionPolicy } from '../types';
export class MemoryStorageProvider {
    constructor(config) {
        this.name = 'MemoryStorage';
        this.type = StorageType.MEMORY;
        this.storage = new Map();
        this.namespaces = new Set();
        this.logger = new Logger('MemoryStorageProvider');
        this.config = {
            maxSize: 100 * 1024 * 1024, // 100MB
            evictionPolicy: EvictionPolicy.LRU,
            ttl: 0, // 기본값: 만료 없음
            ...config
        };
    }
    /**
     * 메모리 스토리지는 항상 사용 가능
     */
    get isAvailable() {
        return true;
    }
    /**
     * 설정된 최대 용량
     */
    get capacity() {
        return this.config.maxSize;
    }
    // ===== 기본 작업 =====
    /**
     * 값 조회
     */
    async get(key) {
        try {
            const entry = this.storage.get(key);
            if (!entry) {
                return { success: true, data: null };
            }
            // 만료 확인
            if (entry.value.metadata?.expires && Date.now() > entry.value.metadata.expires) {
                this.storage.delete(key);
                return { success: true, data: null };
            }
            // 접근 정보 업데이트
            entry.lastAccessed = Date.now();
            entry.accessCount++;
            return { success: true, data: entry.value.data };
        }
        catch (error) {
            this.logger.error('값 조회 실패', { key, error });
            return { success: false, error: new Error('값 조회 중 오류가 발생했습니다') };
        }
    }
    /**
     * 값 저장
     */
    async set(key, value, options) {
        try {
            // 용량 확인 및 정리
            const currentSize = await this.getCurrentSize();
            const valueSize = this.estimateSize(value);
            if (currentSize + valueSize > this.config.maxSize) {
                // 공간 확보를 위한 정리
                await this.evictEntries(valueSize);
            }
            const now = Date.now();
            const metadata = {
                created: now,
                updated: now
            };
            if (options?.version !== undefined) {
                metadata.version = options.version;
            }
            if (options?.tags !== undefined) {
                metadata.tags = options.tags;
            }
            if (options?.ttl || this.config.ttl) {
                metadata.expires = now + (options?.ttl || this.config.ttl);
            }
            const stored = {
                data: value,
                metadata
            };
            const entry = {
                value: stored,
                lastAccessed: now,
                accessCount: 1
            };
            this.storage.set(key, entry);
            // 네임스페이스 추적
            if (options?.namespace) {
                this.namespaces.add(options.namespace);
            }
            return { success: true };
        }
        catch (error) {
            this.logger.error('값 저장 실패', { key, error });
            return { success: false, error: new Error('값 저장 중 오류가 발생했습니다') };
        }
    }
    /**
     * 값 삭제
     */
    async delete(key) {
        try {
            this.storage.delete(key);
            return { success: true };
        }
        catch (error) {
            this.logger.error('값 삭제 실패', { key, error });
            return { success: false, error: new Error('값 삭제 중 오류가 발생했습니다') };
        }
    }
    /**
     * 키 존재 여부 확인
     */
    async exists(key) {
        try {
            const entry = this.storage.get(key);
            if (!entry) {
                return { success: true, data: false };
            }
            // 만료 확인
            if (entry.value.metadata?.expires && Date.now() > entry.value.metadata.expires) {
                this.storage.delete(key);
                return { success: true, data: false };
            }
            return { success: true, data: true };
        }
        catch (error) {
            this.logger.error('키 존재 확인 실패', { key, error });
            return { success: false, error: new Error('키 존재 확인 중 오류가 발생했습니다') };
        }
    }
    // ===== 배치 작업 =====
    /**
     * 여러 값 조회
     */
    async getMany(keys) {
        try {
            const results = new Map();
            for (const key of keys) {
                const result = await this.get(key);
                if (result.success && result.data !== null) {
                    results.set(key, result.data);
                }
            }
            return { success: true, data: results };
        }
        catch (error) {
            this.logger.error('다중 값 조회 실패', { error });
            return { success: false, error: new Error('다중 값 조회 중 오류가 발생했습니다') };
        }
    }
    /**
     * 여러 값 저장
     */
    async setMany(entries, options) {
        try {
            for (const [key, value] of entries) {
                const result = await this.set(key, value, options);
                if (!result.success) {
                    return result;
                }
            }
            return { success: true };
        }
        catch (error) {
            this.logger.error('다중 값 저장 실패', { error });
            return { success: false, error: new Error('다중 값 저장 중 오류가 발생했습니다') };
        }
    }
    /**
     * 여러 값 삭제
     */
    async deleteMany(keys) {
        try {
            for (const key of keys) {
                this.storage.delete(key);
            }
            return { success: true };
        }
        catch (error) {
            this.logger.error('다중 값 삭제 실패', { error });
            return { success: false, error: new Error('다중 값 삭제 중 오류가 발생했습니다') };
        }
    }
    // ===== 쿼리 작업 =====
    /**
     * 키 목록 조회
     */
    async keys(query) {
        try {
            let keys = Array.from(this.storage.keys());
            // 쿼리 필터 적용
            if (query?.prefix) {
                keys = keys.filter(key => key.startsWith(query.prefix));
            }
            // 날짜 필터
            if (query?.afterDate || query?.beforeDate) {
                keys = keys.filter(key => {
                    const entry = this.storage.get(key);
                    if (!entry)
                        return false;
                    const created = new Date(entry.value.metadata?.created || 0);
                    if (query.afterDate && created < query.afterDate) {
                        return false;
                    }
                    if (query.beforeDate && created > query.beforeDate) {
                        return false;
                    }
                    return true;
                });
            }
            // 태그 필터
            if (query?.tags && query.tags.length > 0) {
                keys = keys.filter(key => {
                    const entry = this.storage.get(key);
                    if (!entry || !entry.value.metadata?.tags)
                        return false;
                    return query.tags.some(tag => entry.value.metadata.tags.includes(tag));
                });
            }
            // 페이징
            if (query?.limit) {
                const offset = query.offset || 0;
                keys = keys.slice(offset, offset + query.limit);
            }
            return { success: true, data: keys };
        }
        catch (error) {
            this.logger.error('키 목록 조회 실패', { error });
            return { success: false, error: new Error('키 목록 조회 중 오류가 발생했습니다') };
        }
    }
    /**
     * 값 목록 조회
     */
    async values(query) {
        try {
            const keysResult = await this.keys(query);
            if (!keysResult.success) {
                return { success: false, error: keysResult.error || new Error('키 목록 조회 실패') };
            }
            const values = [];
            for (const key of keysResult.data) {
                const entry = this.storage.get(key);
                if (entry && (!entry.value.metadata?.expires || Date.now() <= entry.value.metadata.expires)) {
                    values.push(entry.value.data);
                }
            }
            return { success: true, data: values };
        }
        catch (error) {
            this.logger.error('값 목록 조회 실패', { error });
            return { success: false, error: new Error('값 목록 조회 중 오류가 발생했습니다') };
        }
    }
    /**
     * 키-값 쌍 목록 조회
     */
    async entries(query) {
        try {
            const keysResult = await this.keys(query);
            if (!keysResult.success) {
                return { success: false, error: keysResult.error || new Error('키 목록 조회 실패') };
            }
            const entries = [];
            for (const key of keysResult.data) {
                const entry = this.storage.get(key);
                if (entry && (!entry.value.metadata?.expires || Date.now() <= entry.value.metadata.expires)) {
                    entries.push([key, entry.value.data]);
                }
            }
            return { success: true, data: entries };
        }
        catch (error) {
            this.logger.error('엔트리 목록 조회 실패', { error });
            return { success: false, error: new Error('엔트리 목록 조회 중 오류가 발생했습니다') };
        }
    }
    // ===== 유틸리티 =====
    /**
     * 스토리지 초기화
     */
    async clear(namespace) {
        try {
            if (namespace) {
                // 특정 네임스페이스만 삭제
                const keysToDelete = [];
                for (const [key, entry] of this.storage) {
                    // Note: namespace tracking would need to be implemented differently
                    // as it's not part of StorageMetadata
                    if (key.startsWith(`${namespace}:`)) {
                        keysToDelete.push(key);
                    }
                }
                for (const key of keysToDelete) {
                    this.storage.delete(key);
                }
                this.namespaces.delete(namespace);
            }
            else {
                // 전체 삭제
                this.storage.clear();
                this.namespaces.clear();
            }
            return { success: true };
        }
        catch (error) {
            this.logger.error('스토리지 초기화 실패', { error });
            return { success: false, error: new Error('스토리지 초기화 중 오류가 발생했습니다') };
        }
    }
    /**
     * 스토리지 크기 조회
     */
    async size(namespace) {
        try {
            let totalSize = 0;
            for (const [key, entry] of this.storage) {
                if (!namespace || key.startsWith(`${namespace}:`)) {
                    totalSize += this.estimateSize(entry.value.data) +
                        this.estimateSize(key) +
                        100; // 메타데이터 예상 크기
                }
            }
            return { success: true, data: totalSize };
        }
        catch (error) {
            this.logger.error('스토리지 크기 조회 실패', { error });
            return { success: false, error: new Error('스토리지 크기 조회 중 오류가 발생했습니다') };
        }
    }
    // ===== 내부 메소드 =====
    /**
     * 현재 전체 크기 계산
     */
    async getCurrentSize() {
        const result = await this.size();
        return result.success && result.data ? result.data : 0;
    }
    /**
     * 객체 크기 추정
     */
    estimateSize(obj) {
        try {
            return JSON.stringify(obj).length * 2; // UTF-16 고려
        }
        catch {
            return 1024; // 기본값 1KB
        }
    }
    /**
     * 공간 확보를 위한 항목 제거
     */
    async evictEntries(requiredSize) {
        const entries = Array.from(this.storage.entries());
        switch (this.config.evictionPolicy) {
            case EvictionPolicy.LRU:
                // 가장 오래 접근하지 않은 항목부터 제거
                entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
                break;
            case EvictionPolicy.LFU:
                // 가장 적게 접근한 항목부터 제거
                entries.sort((a, b) => a[1].accessCount - b[1].accessCount);
                break;
            case EvictionPolicy.FIFO:
                // 가장 오래된 항목부터 제거
                entries.sort((a, b) => (a[1].value.metadata?.created || 0) - (b[1].value.metadata?.created || 0));
                break;
            case EvictionPolicy.RANDOM:
                // 무작위 셔플
                for (let i = entries.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [entries[i], entries[j]] = [entries[j], entries[i]];
                }
                break;
        }
        let freedSize = 0;
        for (const [key, entry] of entries) {
            if (freedSize >= requiredSize) {
                break;
            }
            freedSize += this.estimateSize(entry.value.data) +
                this.estimateSize(key) + 100;
            this.storage.delete(key);
        }
    }
    /**
     * 만료된 항목 정리
     */
    async cleanup() {
        let cleanedCount = 0;
        const now = Date.now();
        for (const [key, entry] of this.storage) {
            if (entry.value.metadata?.expires && now > entry.value.metadata.expires) {
                this.storage.delete(key);
                cleanedCount++;
            }
        }
        if (cleanedCount > 0) {
            this.logger.info('만료된 항목 정리 완료', { cleanedCount });
        }
        return cleanedCount;
    }
    /**
     * 스토리지 통계
     */
    getStats() {
        const stats = {
            itemCount: this.storage.size,
            namespaceCount: this.namespaces.size,
            totalSize: 0,
            averageAccessCount: 0,
            oldestItem: null,
            newestItem: null
        };
        let totalAccessCount = 0;
        let oldestTime = Infinity;
        let newestTime = 0;
        for (const entry of this.storage.values()) {
            stats.totalSize += this.estimateSize(entry.value.data);
            totalAccessCount += entry.accessCount;
            const created = entry.value.metadata?.created || 0;
            if (created < oldestTime) {
                oldestTime = created;
            }
            if (created > newestTime) {
                newestTime = created;
            }
        }
        if (this.storage.size > 0) {
            stats.averageAccessCount = totalAccessCount / this.storage.size;
            stats.oldestItem = new Date(oldestTime);
            stats.newestItem = new Date(newestTime);
        }
        return stats;
    }
}
//# sourceMappingURL=MemoryStorageProvider.js.map